const fs=require('fs');
const path=require('path');
const p=path.join(__dirname,'study-planner-dashboard','tsconfig.json');
const s=fs.readFileSync(p,'utf8');
let obj;
try{obj=JSON.parse(s);}catch(e){console.error('JSON parse failed:',e.message);process.exit(1)}
fs.writeFileSync(p, JSON.stringify(obj,null,2)+'\n','utf8');
console.log('Rewrote',p);
