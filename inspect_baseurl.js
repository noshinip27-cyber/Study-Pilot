const fs=require('fs');
const path=require('path');
const p=path.join(__dirname,'study-planner-dashboard','tsconfig.json');
const s=fs.readFileSync(p,'utf8');
const i=s.indexOf('"baseUrl"');
console.log('index',i);
const start=Math.max(0,i-40);
const seg=s.slice(start,i+40);
console.log('--- snippet ---');
console.log(seg);
console.log('--- chars (pos,hex,chr) ---');
for(let k=0;k<seg.length;k++){
  const pos=start+k;
  const ch=seg[k];
  const code=seg.charCodeAt(k);
  const display = ch==='\n'?'\\n': ch==='\r'?'\\r': ch==='\t'?'\\t': ch;
  console.log(pos, code.toString(16).padStart(4,'0'), display);
}
