"""
StudyPilot — Streamlit App
==========================
Works on localhost AND Streamlit Cloud — no separate HTTP server required.

Architecture
------------
Uses Streamlit's v2 custom component API (st.components.v2.component).

Round-trip flow:
  1. JS calls fetch('/api/generate', ...) — intercepted by the bridge.
  2. Bridge calls window.__sp_setTrigger(action, payload).
  3. Component module calls setTriggerValue('api_call', {action, payload}).
  4. Python receives it as result.api_call, runs the handler, stores the
     result in st.session_state.pending_result, then calls st.rerun().
  5. On the next render Python passes the result via data={"result": ...}.
  6. Component module sees data.result changed and calls window.__sp_respond().
  7. The bridge resolves the pending Promise with the result.
  8. The original fetch() call returns a fake Response object → app.js
     processes the timetable JSON and renders the dashboard.
"""

import base64
import json
import os
import pathlib
import re
import tempfile
import threading

import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# ── Must be the very first Streamlit call ─────────────────────────────────────
st.set_page_config(
    page_title="Study Pilot",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Session-state initialisation ─────────────────────────────────────────────
_STATE_DEFAULTS = {
    "timetable_data":    None,
    "syllabus_data":     None,
    "timetable_rows":    None,
    "timetable_summary": "",
    "pdf_bytes":         None,
    "pending_result":    None,   # API result dict → delivered to JS on next render
    "sp_component":      None,   # cached ComponentRenderer (registered once)
}
for _k, _v in _STATE_DEFAULTS.items():
    if _k not in st.session_state:
        st.session_state[_k] = _v

# ══════════════════════════════════════════════════════════════════════════════
#  ASSET LOADING  — reads files next to app.py at startup
# ══════════════════════════════════════════════════════════════════════════════
_HERE = pathlib.Path(__file__).parent

def _read(name: str) -> str:
    p = _HERE / name
    return p.read_text(encoding="utf-8") if p.exists() else ""

_CSS    = _read("style.css")
_APP_JS = _read("app.js")
_HTML   = _read("index.html")

# ══════════════════════════════════════════════════════════════════════════════
#  PAGE HTML BUILDER
#  Inlines CSS + JS, strips outer <html>/<head>/<body> so the result can be
#  injected as innerHTML by the component JS module.
# ══════════════════════════════════════════════════════════════════════════════

# JS that intercepts every fetch('/api/*') call and routes it through the
# Streamlit component's setTriggerValue() mechanism instead.
_BRIDGE_JS = r"""
(function () {
  'use strict';

  /* ── Pending Promise for in-flight request ──────────────────────────── */
  var _pending = null;

  /**
   * Called by the component JS module (data.result changed) to deliver
   * the Python API response back to the waiting Promise.
   */
  window.__sp_respond = function (payload) {
    if (_pending) {
      var cb = _pending;
      _pending = null;
      cb.resolve(payload);
    }
  };

  /**
   * Send action + payload to Python via Streamlit's trigger mechanism.
   * window.__sp_setTrigger is set by the ES module once the component mounts.
   */
  function _callPython(action, body) {
    return new Promise(function (resolve, reject) {
      _pending = { resolve: resolve, reject: reject };

      var attempts = 0;
      function _trySend() {
        if (typeof window.__sp_setTrigger === 'function') {
          window.__sp_setTrigger(action, body);
        } else if (attempts++ < 100) {
          setTimeout(_trySend, 50);   // wait for component to mount
        } else {
          if (_pending) { _pending.reject(new Error('Streamlit bridge not ready')); _pending = null; }
        }
      }
      _trySend();

      // Safety timeout: 3 min covers slow AI generation
      setTimeout(function () {
        if (_pending) { _pending.reject(new Error('Request timed out (180s)')); _pending = null; }
      }, 180000);
    });
  }

  /* ── Monkey-patch window.fetch ──────────────────────────────────────── */
  var _origFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    var us = typeof url === 'string' ? url : (url.url || String(url));
    var m  = us.match(/\/api\/([\w-]+)/);
    if (!m) return _origFetch(url, opts);           // not our route → passthrough

    var action = m[1];
    var body   = {};
    if (opts && opts.body) { try { body = JSON.parse(opts.body); } catch (_) {} }

    return _callPython(action, body).then(function (r) {
      return {
        ok:     r.ok !== false,
        status: r.status || 200,
        json:   function () { return Promise.resolve(r.data || r); },
        blob:   function () {
          if (r.base64) {
            var bin = atob(r.base64), arr = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            return Promise.resolve(new Blob([arr], { type: 'application/pdf' }));
          }
          return Promise.resolve(new Blob([]));
        },
      };
    }).catch(function (e) {
      return {
        ok:   false, status: 500,
        json: function () { return Promise.resolve({ error: e.message }); },
        blob: function () { return Promise.resolve(new Blob([])); },
      };
    });
  };

  /* ── Override PDF download (original: window.location.href = /api/download) */
  document.addEventListener('DOMContentLoaded', function () {
    // Delay so app.js registers its own listeners first, then we replace them
    setTimeout(function () {
      var btn = document.getElementById('btn-download-pdf');
      if (!btn) return;
      var fresh = btn.cloneNode(true);
      btn.parentNode.replaceChild(fresh, btn);
      fresh.addEventListener('click', function () {
        showToast('Preparing PDF\u2026');
        _callPython('download', {}).then(function (r) {
          if (r && r.base64) {
            var bin = atob(r.base64), arr = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            var blob = new Blob([arr], { type: 'application/pdf' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'StudyPilot_Timetable.pdf';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            showToast('PDF downloaded!');
          } else {
            showToast('No PDF yet \u2014 generate a plan first.');
          }
        }).catch(function (e) { showToast('Download error: ' + e.message); });
      });
    }, 800);
  });

})();
"""

def _build_inner_html() -> str:
    """
    Build the self-contained StudyPilot page as inner HTML (no <html>/<body>).
    CSS is inlined; bridge JS + app JS replace the external <script src=...>.
    """
    html = _HTML

    # 1. Inline the stylesheet
    html = html.replace(
        '<link rel="stylesheet" href="style.css?v=7" />',
        f'<style>\n{_CSS}\n</style>',
    )

    # 2. Inline scripts: bridge first, then app logic
    inline_scripts = (
        f'<script>\n{_BRIDGE_JS}\n</script>\n'
        f'<script>\n{_APP_JS}\n</script>'
    )
    html = html.replace('<script src="app.js?v=7"></script>', inline_scripts)

    # 3. Strip outer <html>/<head>/<body> tags — keep their contents
    head_m = re.search(r'<head[^>]*>(.*?)</head>', html, re.DOTALL | re.IGNORECASE)
    body_m = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)

    if head_m and body_m:
        # Drop <meta> and <title> tags from the head; keep <style> / other content
        head_inner = re.sub(
            r'<title[^>]*>.*?</title>|<meta[^>]*/?>',
            '', head_m.group(1), flags=re.DOTALL | re.IGNORECASE
        )
        return head_inner.strip() + '\n' + body_m.group(1).strip()

    return html  # fallback


# Build once at module load — CSS/JS files don't change between reruns
_INNER_HTML = _build_inner_html()

# ══════════════════════════════════════════════════════════════════════════════
#  STREAMLIT v2 COMPONENT DEFINITION
#  The ES module is registered once.  All dynamic data is passed via data=.
# ══════════════════════════════════════════════════════════════════════════════

_COMPONENT_JS = """
export default function ({ parentElement, setTriggerValue, data }) {

  /* ── First mount: inject the full StudyPilot page ─────────────────────── */
  /* Use a window-level flag so reruns (st.rerun) don't re-inject the DOM.   */
  /* Streamlit recreates the parentElement node on each rerun, but window    */
  /* persists, so window._spMounted survives across Python reruns.           */
  if (!window._spMounted) {
    window._spMounted = true;

    var html = (data && data.pageHtml) ? data.pageHtml : '';
    parentElement.innerHTML = html;

    /* Expose the Streamlit trigger sender to the bridge.
       The bridge JS (injected via innerHTML) calls window.__sp_setTrigger()
       which in turn calls setTriggerValue() to notify Python. */
    window.__sp_setTrigger = function (action, payload) {
      setTriggerValue('api_call', { action: action, payload: payload });
    };

    /* innerHTML does NOT execute <script> tags — re-execute them manually */
    var scripts = Array.from(parentElement.querySelectorAll('script'));
    scripts.forEach(function (orig) {
      var s = document.createElement('script');
      if (orig.src) {
        s.src  = orig.src;
        s.type = orig.type || 'text/javascript';
        s.async = false;
      } else {
        s.textContent = orig.textContent;
      }
      orig.parentNode.replaceChild(s, orig);
    });
  } else {
    /* On reruns the parentElement is a fresh empty node — move the already- */
    /* rendered app shell back into it without re-running any scripts.        */
    if (window._spRoot && window._spRoot.parentNode !== parentElement) {
      parentElement.appendChild(window._spRoot);
    }
  }

  /* Store a reference to the rendered root so we can re-attach it on reruns */
  if (!window._spRoot) {
    window._spRoot = parentElement.firstElementChild || parentElement;
  }

  /* ── Subsequent renders: deliver API result to the waiting Promise ─────── */
  if (data && data.result !== null && data.result !== undefined) {
    var attempts = 0;
    function _deliver() {
      if (typeof window.__sp_respond === 'function') {
        window.__sp_respond(data.result);
      } else if (attempts++ < 150) {
        setTimeout(_deliver, 30);
      }
    }
    _deliver();
  }
}
"""

# ══════════════════════════════════════════════════════════════════════════════
#  BACKEND HANDLERS
# ══════════════════════════════════════════════════════════════════════════════

def _lazy():
    """Lazy-import heavy modules so startup stays fast."""
    from extract import extract_syllabus, extact_text_from_pdf
    from planner import allocate_hours, generate_weekly_plan, clean_json_response
    from pdf_export import generate_pdf
    from remainder import send_daily_nudge
    return (extract_syllabus, extact_text_from_pdf,
            allocate_hours, generate_weekly_plan, clean_json_response,
            generate_pdf, send_daily_nudge)


def _handle_clear(_p):
    for k in ("timetable_data", "syllabus_data", "timetable_rows",
              "pdf_bytes", "pending_result"):
        st.session_state[k] = None
    st.session_state.timetable_summary = ""
    return {"ok": True, "data": {"cleared": True}}


def _handle_timetable(_p):
    d = st.session_state.timetable_data
    return {"ok": True, "data": d if d else {"timetable": []}}


def _handle_generate(payload: dict):
    (extract_syllabus, extact_text_from_pdf,
     allocate_hours, generate_weekly_plan, clean_json_response,
     generate_pdf, send_daily_nudge) = _lazy()

    file_b64    = payload.get("file_data")
    study_hours = float(payload.get("study_hours", 4))
    email       = payload.get("email", "")

    if file_b64:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
            f.write(base64.b64decode(file_b64))
            tmp_path = f.name
        try:
            raw_text = extact_text_from_pdf(tmp_path)
            raw_syl  = extract_syllabus(raw_text)
            cleaned  = raw_syl.strip()
            if "```" in cleaned:
                cleaned = cleaned.split("```")[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            syllabus_data = json.loads(cleaned.strip())
        finally:
            os.unlink(tmp_path)
    elif st.session_state.syllabus_data:
        syllabus_data = st.session_state.syllabus_data
    else:
        return {"ok": False, "status": 400,
                "data": {"error": "No syllabus PDF uploaded."}}

    st.session_state.syllabus_data = syllabus_data
    allocated      = allocate_hours(syllabus_data, daily_hours=study_hours)
    timetable_data = json.loads(clean_json_response(
        generate_weekly_plan(allocated, daily_hours=study_hours)))

    st.session_state.timetable_data = timetable_data
    rows, summary = _flatten_timetable(timetable_data)
    st.session_state.timetable_rows    = rows
    st.session_state.timetable_summary = summary
    st.session_state.pdf_bytes         = _make_pdf(rows, summary, generate_pdf)

    if email:
        _send_email_async(rows, email, st.session_state.pdf_bytes, send_daily_nudge)

    return {"ok": True, "data": timetable_data}


def _handle_redistribute(payload: dict):
    (_, _, allocate_hours, generate_weekly_plan, clean_json_response,
     generate_pdf, send_daily_nudge) = _lazy()

    if not st.session_state.syllabus_data:
        return {"ok": False, "status": 400,
                "data": {"error": "No syllabus loaded. Generate a plan first."}}

    study_hours = float(payload.get("study_hours", 4))
    email       = payload.get("email", "")
    allocated   = allocate_hours(st.session_state.syllabus_data, daily_hours=study_hours)
    timetable_data = json.loads(clean_json_response(
        generate_weekly_plan(allocated, daily_hours=study_hours)))

    st.session_state.timetable_data = timetable_data
    rows, summary = _flatten_timetable(timetable_data)
    st.session_state.timetable_rows    = rows
    st.session_state.timetable_summary = summary
    st.session_state.pdf_bytes         = _make_pdf(rows, summary, generate_pdf)

    if email:
        _send_email_async(rows, email, st.session_state.pdf_bytes, send_daily_nudge)

    return {"ok": True, "data": timetable_data}


def _handle_download(_p):
    pdf = st.session_state.pdf_bytes
    if not pdf:
        return {"ok": False, "status": 404,
                "data": {"error": "No PDF yet. Generate a plan first."}}
    return {"ok": True, "base64": base64.b64encode(pdf).decode()}


def _handle_email(payload: dict):
    (_, _, _, _, _, _, send_daily_nudge) = _lazy()
    email = payload.get("email", "").strip()
    if not email:
        return {"ok": False, "status": 400,
                "data": {"error": "Email address required."}}
    rows = st.session_state.timetable_rows
    if not rows:
        return {"ok": False, "status": 400,
                "data": {"error": "No timetable found. Generate a plan first."}}
    _send_email_async(rows, email, st.session_state.pdf_bytes, send_daily_nudge)
    return {"ok": True, "data": {"message": "Sent!"}}


_ROUTES = {
    "clear":             _handle_clear,
    "timetable":         _handle_timetable,
    "generate":          _handle_generate,
    "redistribute":      _handle_redistribute,
    "redistribute-plan": _handle_redistribute,
    "download":          _handle_download,
    "email-reminder":    _handle_email,
    "email-remainder":   _handle_email,
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _flatten_timetable(tt: dict):
    rows = []
    for day in tt.get("timetable", []):
        for slot in day.get("slots", []):
            rows.append({
                "date":      day["date"],
                "subject":   slot["subject"],
                "topic":     ", ".join(slot.get("chapters_to_cover", [])),
                "minutes":   slot["duration_minutes"],
                "notes":     slot.get("notes", ""),
                "exam_date": slot.get("exam_date", "2099-12-31"),
            })
    return rows, tt.get("weekly_summary", "")


def _make_pdf(rows, summary, generate_pdf_fn) -> bytes | None:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
        tmp = f.name
    try:
        generate_pdf_fn(rows, summary, output_path=tmp)
        with open(tmp, "rb") as f:
            return f.read()
    except Exception as e:
        print(f"[StudyPilot] PDF error: {e}")
        return None
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def _send_email_async(rows, email, pdf_bytes, send_fn):
    def _worker():
        tmp = None
        try:
            if pdf_bytes:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
                    f.write(pdf_bytes)
                    tmp = f.name
            send_fn(rows, recipient_email=email, pdf_path=tmp)
            print(f"[StudyPilot] ✓ Email → {email}")
        except Exception as e:
            print(f"[StudyPilot] ✗ Email failed: {e}")
        finally:
            if tmp and os.path.exists(tmp):
                os.unlink(tmp)
    threading.Thread(target=_worker, daemon=True).start()


# ══════════════════════════════════════════════════════════════════════════════
#  RENDER
# ══════════════════════════════════════════════════════════════════════════════

# Hide all Streamlit chrome so only our UI shows
st.markdown("""
<style>
#MainMenu, footer, header { visibility: hidden; }
.block-container     { padding: 0 !important; max-width: 100% !important; }
[data-testid="stAppViewContainer"] { padding: 0 !important; }
[data-testid="stVerticalBlock"]    { gap: 0 !important; }
</style>
""", unsafe_allow_html=True)

# Pop the pending API result (consumed once; cleared so it isn't re-delivered)
_result = st.session_state.pending_result
st.session_state.pending_result = None

# Register the component definition exactly once per session
if st.session_state.sp_component is None:
    st.session_state.sp_component = st.components.v2.component(
        name="studypilot_main",
        js=_COMPONENT_JS,
        isolate_styles=False,   # use real window scope — no Shadow DOM
    )

_StudyPilot = st.session_state.sp_component

# Mount the component.
# - data.pageHtml  → full inner HTML injected once on first mount
# - data.result    → API response delivered to the pending JS Promise
result = _StudyPilot(
    data={"pageHtml": _INNER_HTML, "result": _result},
    default={},
    on_api_call_change=lambda: None,
    width="stretch",
    height=940,
    key="sp",
)

# ── Dispatch incoming API call from the JS bridge ─────────────────────────────
_incoming = getattr(result, "api_call", None) if result else None

if _incoming and isinstance(_incoming, dict) and "action" in _incoming:
    _action  = _incoming["action"]
    _payload = _incoming.get("payload", {})
    _handler = _ROUTES.get(_action)

    _spinner = (
        "⏳ Generating your study plan — this takes ~30 seconds…"
        if _action == "generate" else
        "⏳ Redistributing your study plan…"
        if _action in ("redistribute", "redistribute-plan") else
        None
    )

    try:
        if _spinner:
            with st.spinner(_spinner):
                _api_result = _handler(_payload) if _handler else {
                    "ok": False, "status": 404,
                    "data": {"error": f"Unknown action: {_action}"}
                }
        else:
            _api_result = _handler(_payload) if _handler else {
                "ok": False, "status": 404,
                "data": {"error": f"Unknown action: {_action}"}
            }
    except Exception as _exc:
        _api_result = {"ok": False, "status": 500, "data": {"error": str(_exc)}}

    st.session_state.pending_result = _api_result
    st.rerun()
