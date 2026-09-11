// Local-only network shaping for browser QA. No credentials or response bodies are logged.
// Run the demo app on :3000, then `node scripts/qa-network-proxy.mjs` and visit :3001.
import http from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {once} from 'node:events';

const latencyMs=300;
const bytesPerTick=8192;
const tickMs=125; // 64 KiB/s per response, with 300 ms initial latency.

http.createServer(async (request,response)=>{
  await delay(latencyMs);
  if(response.destroyed)return;
  const upstream=http.request({hostname:'127.0.0.1',port:3000,path:request.url,method:request.method,headers:{...request.headers,host:'localhost:3000','accept-encoding':'identity'}},async incoming=>{
    response.writeHead(incoming.statusCode??502,incoming.headers);
    try {
      for await(const chunk of incoming) {
        for(let start=0;start<chunk.length;start+=bytesPerTick) {
          if(response.destroyed){upstream.destroy();return;}
          if(!response.write(chunk.subarray(start,start+bytesPerTick)))await once(response,'drain');
          await delay(tickMs);
        }
      }
      response.end();
    } catch {response.destroy();}
  });
  upstream.on('error',()=>{if(!response.headersSent)response.writeHead(502);response.end('Local QA upstream unavailable');});
  request.on('aborted',()=>upstream.destroy());
  response.on('close',()=>{if(!response.writableEnded)upstream.destroy();});
  request.pipe(upstream);
}).listen(3001,'127.0.0.1',()=>console.info('QA proxy: http://127.0.0.1:3001 — 300 ms latency, 64 KiB/s per response'));
