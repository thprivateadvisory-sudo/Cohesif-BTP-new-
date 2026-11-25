const {chromium}=require('playwright');
const [W,N]=process.argv.slice(2).map(Number);const FPS=30,TOTAL=46*FPS;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+process.cwd()+'/v/film.html');await p.evaluate(()=>window.ready);
for(let f=W;f<TOTAL;f+=N){await p.evaluate(t=>seek(t),f/FPS);await p.screenshot({path:`frames/${String(f).padStart(5,'0')}.png`});}
await b.close()})();
