import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
const files=(await readdir('dist/server',{recursive:true})).filter(f=>f.endsWith('.js')&&f!=='index.js');
const mf=new Miniflare({modules:[{type:'ESModule',path:'dist/server/index.js'},...files.map(f=>({type:'ESModule',path:'dist/server/'+f}))],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'test-db'},cf:false});
const db=await mf.getD1Database('DB');
await db.prepare(await readFile('drizzle/0000_round_umar.sql','utf8')).run();
const base='http://localhost';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw new Error('Only run against a local built Worker with synthetic auth headers.');
const ids=['qa-a-'+randomUUID(),'qa-b-'+randomUUID()];
async function request(user,method='GET',data,origin=base){const headers={'Content-Type':'application/json',Origin:origin};if(user){headers['oai-authenticated-user-id']=user;headers['oai-authenticated-user-email']='qa@example.test';}const r=await mf.dispatchFetch(base+'/api/state',{method,headers,body:data?JSON.stringify(data):undefined});return {status:r.status,body:await r.json()};}
const settings={goal:'track',target:null,baseline:10,price:50,portions:20,tone:'quiet',setback:'quiet',paused:false,timezone:'Europe/Stockholm'};
const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm'}).format(new Date());
try{
 assert.equal((await request(null)).status,401);
 let a=await request(ids[0]);assert.equal(a.body.revision,-1);
 let r=await request(ids[0],'POST',{operation:randomUUID(),revision:-1,command:{type:'settings',values:settings,effective:day,onboard:true}},'https://foreign.example');assert.equal(r.status,403);
 r=await request(ids[0],'POST',{operation:randomUUID(),revision:-1,command:{type:'settings',values:settings,effective:day,onboard:true}});assert.equal(r.status,200);
 const payload={operation:randomUUID(),revision:0,command:{type:'entry',entry:{id:randomUUID(),quantity:6,time:new Date().toISOString(),context:null}}};
 r=await request(ids[0],'POST',payload);assert.equal(r.status,200);assert.equal(r.body.journal.entries.length,1);
 r=await request(ids[0],'POST',payload);assert.equal(r.status,200);assert.equal(r.body.journal.entries.length,1);
 assert.equal((await request(ids[1])).body.journal.entries.length,0);
 assert.equal((await request(ids[1],'POST',{operation:randomUUID(),revision:-1,command:{type:'settings',values:settings,effective:day,onboard:true}})).status,200);
 const foreignDelete=await request(ids[1],'POST',{operation:randomUUID(),revision:0,command:{type:'remove',id:payload.command.entry.id}});assert.equal(foreignDelete.status,200);
 assert.equal((await request(ids[0])).body.journal.entries.length,1);
 r=await request(ids[0],'POST',{operation:randomUUID(),revision:0,command:{type:'complete',day}});assert.equal(r.status,409);
 a=await request(ids[0]);const writes=await Promise.all([1,2].map(()=>request(ids[0],'POST',{operation:randomUUID(),revision:a.body.revision,command:{type:'entry',entry:{id:randomUUID(),quantity:1,time:new Date().toISOString(),context:null}}})));assert.deepEqual(writes.map(x=>x.status).sort(),[200,409]);
 a=await request(ids[0]);assert.equal(a.body.journal.entries.length,2);
 assert.equal((await request(ids[0],'DELETE',{confirm:'NO'})).status,400);
 assert.equal((await request(ids[1],'DELETE',{confirm:'DELETE'})).status,200);
 assert.equal((await request(ids[0])).body.journal.entries.length,2);
 assert.equal((await request(ids[1])).body.revision,-1);
 console.log('PASS: authentication, origin checks, persistence, idempotency, account isolation, CAS concurrency, and deletion isolation.');
}finally{await mf.dispose();}

