import http from 'node:http';
import {readFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
const files=new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/index.html',['index.html','text/html; charset=utf-8']],
  ['/style.css',['style.css','text/css; charset=utf-8']],
  ['/app.mjs',['app.mjs','text/javascript; charset=utf-8']],
  ['/core.mjs',['core.mjs','text/javascript; charset=utf-8']]
]);
const server=http.createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const file=files.get(new URL(req.url,'http://localhost').pathname);
  if(!file){res.writeHead(404);res.end('Nicht gefunden');return;}
  try{
    const content=await readFile(new URL(file[0],root));
    res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(500);res.end('Datei konnte nicht geladen werden.');}
});
server.listen(8080,'127.0.0.1',()=>console.log('Farbwerk läuft: http://127.0.0.1:8080 — Beenden mit Strg+C'));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port 8080 ist bereits belegt.':error.message);process.exitCode=1;});
