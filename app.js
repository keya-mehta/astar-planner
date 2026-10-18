(function(){
"use strict";

/* =========================================================
   Helpers
   ========================================================= */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const TD=()=>iso(today());
const diffDays=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOWL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEK=[1,2,3,4,5,6,0];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtDate=s=>{const d=parse(s);return `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`};
const weekStart=d=>{const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x};
const toMin=t=>{const[h,m]=String(t).split(':').map(Number);return h*60+(m||0)};
const fromMin=m=>`${pad(Math.floor(m/60)%24)}:${pad(m%60)}`;
const fmtMin=m=>{m=Math.round(m);return m>=60?`${Math.floor(m/60)} h${m%60?` ${m%60} min`:''}`:`${m} min`};
const fmtH=m=>{const h=m/60;return (h>=10?h.toFixed(0):h.toFixed(1)).replace(/\.0$/,'')+' h'};
const uid=()=>Math.random().toString(36).slice(2,10);
const nowHM=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const isoWeek=d=>{const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y)/864e5+1)/7)};
const ic=(id,cls='')=>`<svg class="${cls}"><use href="#i-${id}"/></svg>`;
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const PRI={high:0,med:1,low:2};
const PRIL={high:'High',med:'Medium',low:'Low'};
const KINDS={class:'Class',school:'School',test:'Test',personal:'Personal',study:'Study'};
const PLANL={read:'Reading',paper:'Past paper',prep:'Test prep',hw:'Homework'};
const PALETTE=['#244B75','#3E6E72','#8A6A3A','#577A4F','#7B4F6B','#8C5545','#4F5D7C','#6B6A3E','#5E4E7A','#3F6B8C'];

/* =========================================================
   Data
   ========================================================= */
const DEFAULT_SETTINGS={name:'',goal:14,focusLen:45,readMin:15,paperMin:15,prepMin:30,prepDays:7,maxBlock:45,horizon:21};
const DEFAULT_SUBJECTS=[['Mathematics'],['Physics'],['Chemistry'],['Biology'],['English'],['History'],['Computer Science']].map(([n],i)=>({id:uid(),name:n,color:PALETTE[i]}));
function emptyState(name){
  const free=[];
  [1,2,3,4,5].forEach(d=>free.push({id:uid(),dow:d,start:'16:00',end:'20:00'}));
  [6,0].forEach(d=>{free.push({id:uid(),dow:d,start:'10:00',end:'12:30'});free.push({id:uid(),dow:d,start:'16:00',end:'19:00'})});
  return {v:2,sample:false,freeDefault:true,settings:{...DEFAULT_SETTINGS,name:name||''},subjects:DEFAULT_SUBJECTS.map(s=>({...s,id:uid()})),
    classes:[],free,tasks:[],tests:[],events:[],doneBlocks:[],log:[],revision:[]};
}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function exampleState(name){
  const T=today(),D=n=>iso(addDays(T,n));
  const subjects=[['math','Mathematics'],['phys','Physics'],['chem','Chemistry'],['bio','Biology'],['eng','English'],['hist','History'],['cs','Computer Science']].map(([id,n],i)=>({id,name:n,color:PALETTE[i]}));
  const periods=[['08:00','08:45'],['08:45','09:30'],['09:45','10:30'],['10:30','11:15'],['11:45','12:30'],['12:30','13:15'],['13:30','14:15']];
  const rot=['math','phys','eng','chem','hist','bio','cs','math','chem','eng','phys','bio','math','hist','cs'];
  const rooms={math:'Room 12',phys:'Physics lab',chem:'Chem lab',bio:'Room 7',eng:'Room 3',hist:'Room 5',cs:'IT room'};
  const classes=[];let k=0;
  [1,2,3,4,5].forEach(d=>periods.forEach(([s,e],i)=>{const sub=rot[(k++ +d)%rot.length];classes.push({id:uid(),subject:sub,dow:[d],start:s,end:e,room:rooms[sub]})}));
  const free=[];
  [1,3,5].forEach(d=>free.push({id:uid(),dow:d,start:'15:30',end:'21:00'}));
  [2,4].forEach(d=>free.push({id:uid(),dow:d,start:'18:00',end:'21:00'}));
  [6,0].forEach(d=>{free.push({id:uid(),dow:d,start:'09:30',end:'13:00'});free.push({id:uid(),dow:d,start:'15:00',end:'21:00'})});
  const t=(title,subject,due,est,priority,type,done=false)=>({id:uid(),title,subject,due:D(due),est,priority,type,done});
  const tasks=[
    t('Integration by parts, worksheet 7','math',1,45,'high','Homework'),
    t('Lab report: simple harmonic motion','phys',3,90,'high','Assignment'),
    t('Organic nomenclature, practice set 4','chem',2,30,'med','Homework'),
    t('Essay draft: narrative voice in Jane Eyre','eng',5,120,'med','Assignment'),
    t('Source analysis: causes of the 1857 uprising','hist',4,60,'med','Assignment'),
    t('Recursion exercises, set B','cs',6,40,'low','Homework'),
    t('Problem set 3: kinematics','phys',-2,50,'med','Homework',true)];
  const tests=[
    {id:uid(),title:'Organic nomenclature quiz',subject:'chem',date:D(3),time:'10:30',dur:30,prep:60},
    {id:uid(),title:'Unit test: Integration',subject:'math',date:D(6),time:'09:45',dur:45,prep:40},
    {id:uid(),title:'Mid-term: Mechanics and waves',subject:'phys',date:D(11),time:'08:00',dur:90,prep:20}];
  const events=[{id:uid(),title:'Badminton practice',kind:'personal',dow:[2,4],start:'16:30',end:'17:30'}];
  const r=mulberry(1842),log=[],subs=subjects.map(s=>s.id);
  for(let i=-56;i<=-1;i++){const d=addDays(T,i),we=d.getDay()%6===0;if(r()<.12)continue;
    const tot=Math.round((we?100:55)+r()*(we?110:85));const n=1+(r()<.55?1:0);
    for(let j=0;j<n;j++)log.push({id:uid(),date:iso(d),subject:subs[Math.floor(r()*subs.length)],min:Math.round(tot/n/5)*5})}
  const rv={math:['Differentiation','Integration','Sequences and series','Vectors'],phys:['Kinematics',"Newton's laws",'Waves'],chem:['Mole concept','Bonding','Organic nomenclature'],eng:['Jane Eyre: themes','Essay structure']};
  const revision=[];for(const s in rv)rv[s].forEach((topic,i)=>revision.push({id:uid(),subject:s,topic,done:i<2}));
  return {v:2,sample:true,settings:{...DEFAULT_SETTINGS,name:name||''},subjects,classes,free,tasks,tests,events,doneBlocks:[],log,revision};
}
function normalize(o){
  if(!o||typeof o!=='object')return null;
  const base=emptyState('');
  const s={...base,...o,settings:{...DEFAULT_SETTINGS,...(o.settings||{})}};
  for(const k of ['subjects','classes','free','tasks','tests','events','doneBlocks','log','revision'])if(!Array.isArray(s[k]))s[k]=[];
  s.events=s.events.filter(e=>e.kind!=='study'); // v1 hand-made study sessions are now planned automatically
  s.log.forEach(l=>{if(!l.id)l.id=uid()});
  s.v=2;return s;
}

/* =========================================================
   Accounts and storage
   ========================================================= */
const CFG=window.QUIRE_CONFIG||{};
const CLOUD=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase);
const sb=CLOUD?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey):null;
let user=null,S=null,syncState='saved',saveT=null;
const cacheKey=()=>'quire.v2.'+(user?user.id:'local');
function cacheWrite(){try{localStorage.setItem(cacheKey(),JSON.stringify(S))}catch(e){}}
function cacheRead(){try{const r=localStorage.getItem(cacheKey());return r?normalize(JSON.parse(r)):null}catch(e){return null}}
function save(){
  if(!S)return;cacheWrite();
  if(!CLOUD)return;
  setSync('saving');clearTimeout(saveT);saveT=setTimeout(pushCloud,700);
}
async function pushCloud(){
  if(!user)return;
  const{error}=await sb.from('planners').upsert({user_id:user.id,data:S,updated_at:new Date().toISOString()});
  setSync(error?'error':'saved');
}
function setSync(s){syncState=s;renderAcct()}
window.addEventListener('online',()=>{if(CLOUD&&user&&syncState==='error')pushCloud()});

let authMode='in',authMsg='',authErr='',recovering=/type=recovery/.test(location.hash);
function showAuth(mode){
  document.body.classList.remove('authed');if(mode)authMode=mode;
  const tab=(m,l)=>`<button type="button" class="${authMode===m?'on':''}" data-auth="${m}">${l}</button>`;
  let form='';
  if(authMode==='recover')form=`<h2>Choose a new password</h2>
    <label class="field"><span>New password</span><input class="in" type="password" id="a-pass" minlength="8" required autocomplete="new-password"></label>
    <button class="btn" type="submit">Save password</button>`;
  else if(authMode==='forgot')form=`<h2>Reset your password</h2><small>Enter your email and we'll send a link to set a new password.</small>
    <label class="field"><span>Email</span><input class="in" type="email" id="a-email" required autocomplete="email"></label>
    <button class="btn" type="submit">Send reset link</button><button type="button" class="link" data-auth="in">Back to sign in</button>`;
  else form=`<div class="tabs">${tab('in','Sign in')}${tab('up','Create account')}</div>
    ${authMode==='up'?'<label class="field"><span>First name</span><input class="in" id="a-name" required autocomplete="given-name"></label>':''}
    <label class="field"><span>Email</span><input class="in" type="email" id="a-email" required autocomplete="email"></label>
    <label class="field"><span>Password</span><input class="in" type="password" id="a-pass" required minlength="8" autocomplete="${authMode==='up'?'new-password':'current-password'}"></label>
    ${authMode==='up'?'<small>At least 8 characters.</small>':''}
    <button class="btn" type="submit">${authMode==='up'?'Create account':'Sign in'}</button>
    ${authMode==='in'?'<button type="button" class="link" data-auth="forgot">Forgot your password?</button>':''}`;
  $('#auth').innerHTML=`<div class="auth">
    <div class="lead"><div>
      <div class="brand" style="padding:0"><svg width="28" height="28" viewBox="0 0 26 26" fill="none" stroke="#B89A57" stroke-width="1.3" aria-hidden="true"><path d="M3 6.5c3.5-1.6 7-1.6 10 .8 3-2.4 6.5-2.4 10-.8v13c-3.5-1.6-7-1.6-10 .8-3-2.4-6.5-2.4-10-.8z"/><path d="M13 7.3v13"/></svg><div><b>Quire</b><small>Study planner</small></div></div>
      <h1>Your week, planned around your classes.</h1>
      <p>Add your timetable, the hours you're free, your homework and your tests. Quire builds the study plan and keeps it current.</p>
      <ul><li><b>Every day</b>15 minutes of reading and 15 of past papers</li><li><b>Before tests</b>A prep session each day in the final week</li><li><b>Homework</b>Split into blocks that finish before the deadline</li></ul>
    </div><small style="color:#7E8BA0">Your planner is private to your account.</small></div>
    <div class="pane"><form id="authForm" novalidate>${form}<div class="err" id="a-err">${esc(authErr)}</div>${authMsg?`<div class="info">${esc(authMsg)}</div>`:''}</form></div></div>`;
  authErr='';authMsg='';
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-auth]');if(!b)return;showAuth(b.dataset.auth);$('#a-email')?.focus()});
document.addEventListener('submit',async e=>{
  if(e.target.id!=='authForm')return;e.preventDefault();
  const f=e.target;if(!f.checkValidity()){f.reportValidity();return}
  const btn=f.querySelector('.btn');btn.disabled=true;const was=btn.textContent;btn.textContent='Please wait…';
  const email=$('#a-email')?.value.trim(),pass=$('#a-pass')?.value;
  const fail=m=>{btn.disabled=false;btn.textContent=was;$('#a-err').textContent=m};
  try{
    if(authMode==='in'){const{data,error}=await sb.auth.signInWithPassword({email,password:pass});if(error)return fail(friendly(error));await enter(data.user)}
    else if(authMode==='up'){const name=$('#a-name').value.trim();
      const{data,error}=await sb.auth.signUp({email,password:pass,options:{data:{name},emailRedirectTo:location.origin+location.pathname}});
      if(error)return fail(friendly(error));
      if(data.session)await enter(data.user);else{authMsg=`Check ${email} for a confirmation link, then come back and sign in.`;showAuth('in')}}
    else if(authMode==='forgot'){const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(error)return fail(friendly(error));authMsg='If that email has an account, a reset link is on its way.';showAuth('in')}
    else if(authMode==='recover'){const{data,error}=await sb.auth.updateUser({password:pass});if(error)return fail(friendly(error));
      recovering=false;history.replaceState(null,'',location.pathname+'#dashboard');await enter(data.user)}
  }catch(err){fail('Could not reach the server. Check your connection and try again.')}
});
function friendly(err){const m=(err&&err.message)||'';
  if(/invalid login/i.test(m))return 'That email and password do not match an account.';
  if(/not confirmed/i.test(m))return 'Confirm your email first. The link is in your inbox.';
  if(/already registered/i.test(m))return 'An account with that email already exists. Sign in instead.';
  if(/password/i.test(m)&&/6|8|characters/.test(m))return 'Use a password of at least 8 characters.';
  if(/rate/i.test(m))return 'Too many attempts. Wait a minute and try again.';
  return m||'Something went wrong. Try again.'}

async function enter(u){
  user=u;$('#auth').innerHTML='<div class="boot">Opening your planner…</div>';
  let remote=null,err=null;
  try{const r=await sb.from('planners').select('data').eq('user_id',u.id).maybeSingle();remote=r.data;err=r.error}catch(e){err=e}
  if(err){S=cacheRead()||emptyState(u.user_metadata?.name);syncState='error'}
  else if(remote&&remote.data&&remote.data.v){S=normalize(remote.data);syncState='saved'}
  else{S=cacheRead()||emptyState(u.user_metadata?.name);await pushCloud()}
  startApp();
}
async function signOut(){if(CLOUD){clearTimeout(saveT);if(syncState==='saving')await pushCloud();await sb.auth.signOut()}user=null;S=null;location.hash='';showAuth('in')}

async function boot(){
  if(!CLOUD){S=cacheRead()||migrateV1()||emptyState('');startApp();return}
  sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY'){recovering=true;showAuth('recover')}});
  const{data:{session}}=await sb.auth.getSession();
  if(recovering&&session){showAuth('recover');return}
  if(session)await enter(session.user);else showAuth('in');
}
function migrateV1(){try{const r=localStorage.getItem('quire.v1');return r?normalize(JSON.parse(r)):null}catch(e){return null}}

/* =========================================================
   Lookups
   ========================================================= */
const sub=id=>S.subjects.find(s=>s.id===id)||{id,name:id?'Other':'General',color:'#8A93A3'};
const subjMark=id=>{const s=sub(id);return `<span class="subj"><i style="background:${esc(s.color)}"></i>${esc(s.name)}</span>`};
const openTasks=()=>S.tasks.filter(t=>!t.done);
const byNext=(a,b)=>a.due<b.due?-1:a.due>b.due?1:PRI[a.priority]-PRI[b.priority];
function relShort(d){const n=diffDays(TD(),d);return n<0?`${-n} d overdue`:n===0?'due today':n===1?'due tomorrow':`due ${fmtDate(d)}`}
function dueHTML(d,done){const n=diffDays(TD(),d);let rel=n<0?`${-n} d overdue`:n===0?'Today':n===1?'Tomorrow':`In ${n} days`;if(done)rel='Done';
  return `<span class="due ${n<0&&!done?'late':''}">${fmtDate(d)}<small>${rel}</small></span>`}
function fixedOn(day){
  const wd=parse(day).getDay(),out=[];
  for(const c of S.classes)if(c.dow.includes(wd))out.push({id:c.id,src:'class',kind:'class',title:sub(c.subject).name,subject:c.subject,room:c.room,start:c.start,end:c.end});
  for(const e of S.events)if(e.day===day||(Array.isArray(e.dow)&&e.dow.includes(wd)))out.push({...e,src:'event'});
  for(const t of S.tests)if(t.date===day)out.push({id:t.id,src:'test',kind:'test',title:t.title,subject:t.subject,start:t.time,end:fromMin(toMin(t.time)+(t.dur||60))});
  return out.sort((a,b)=>(b.allDay?1:0)-(a.allDay?1:0)||toMin(a.start)-toMin(b.start));
}
const minsOn=day=>S.log.filter(l=>l.date===day).reduce((a,l)=>a+l.min,0);
function weekMins(off=0){const ws=weekStart(addDays(today(),off*7));const a=iso(ws),b=iso(addDays(ws,6));return S.log.filter(l=>l.date>=a&&l.date<=b).reduce((s,l)=>s+l.min,0)}
function revStats(sid){const r=S.revision.filter(x=>!sid||x.subject===sid);return{done:r.filter(x=>x.done).length,total:r.length}}
function freeMinsWeek(){return S.free.reduce((a,f)=>a+Math.max(0,toMin(f.end)-toMin(f.start)),0)}

/* =========================================================
   Planner
   ========================================================= */
const GAP=5;
function mergeIv(iv){iv=iv.map(x=>[x[0],x[1]]).sort((a,b)=>a[0]-b[0]);const o=[];for(const x of iv){if(o.length&&x[0]<=o[o.length-1][1])o[o.length-1][1]=Math.max(o[o.length-1][1],x[1]);else o.push(x)}return o}
function subIv(iv,s,e){const o=[];for(const[a,b] of iv){if(e<=a||s>=b){o.push([a,b]);continue}if(s>a)o.push([a,s]);if(e<b)o.push([e,b])}return o}
function freeWindows(day){return mergeIv(S.free.filter(f=>f.dow===parse(day).getDay()).map(f=>[toMin(f.start),toMin(f.end)]))}
function freeOn(day){
  let iv=freeWindows(day);
  for(const x of fixedOn(day))if(!x.allDay)iv=subIv(iv,toMin(x.start)-(x.kind==='class'?0:GAP),toMin(x.end)+GAP);
  for(const b of S.doneBlocks)if(b.day===day)iv=subIv(iv,toMin(b.start),toMin(b.end)+GAP);
  if(day===TD()){const n=Math.ceil((nowHM()+5)/5)*5;iv=subIv(iv,0,n)}
  return iv.filter(([a,b])=>b-a>=10);
}
function carve(fr,i,s,e){const[a,b]=fr[i];const rep=[];if(s-GAP>a&&s>a)rep.push([a,Math.max(a,s-GAP)]);if(e+GAP<b)rep.push([e+GAP,b]);fr.splice(i,1,...rep.filter(([x,y])=>y-x>=10))}
function takeEarly(fr,min){for(let i=0;i<fr.length;i++){const[a,b]=fr[i];if(b-a>=min){carve(fr,i,a,a+min);return[a,a+min]}}return null}
function takeLate(fr,min){for(let i=fr.length-1;i>=0;i--){const[a,b]=fr[i];if(b-a>=min){carve(fr,i,b-min,b);return[b-min,b]}}return null}
function takeUpTo(fr,max,minLen){for(let i=0;i<fr.length;i++){const[a,b]=fr[i];const len=b-a;if(len>=minLen){const m=Math.floor(Math.min(max,len)/5)*5;carve(fr,i,a,a+m);return[a,a+m]}}return null}

let planCache=null,planStamp='';
function plan(){
  const stamp=TD()+'|'+Math.floor(nowHM()/5)+'|'+planVersion;
  if(planCache&&planStamp===stamp)return planCache;
  const st=S.settings,T=TD(),H=Math.max(7,Math.min(42,+st.horizon||21));
  const days=[...Array(H)].map((_,i)=>iso(addDays(today(),i)));
  const fr={};days.forEach(d=>fr[d]=freeOn(d));
  const doneKeys=new Set(S.doneBlocks.map(b=>b.key));
  const blocks=S.doneBlocks.map(b=>({...b,done:true}));
  const warnings=[];
  const add=(day,slot,meta)=>{blocks.push({...meta,day,start:fromMin(slot[0]),end:fromMin(slot[1]),min:slot[1]-slot[0],done:false})};

  // 1. Daily habits, placed late in the day so prime time stays free for homework.
  const missRead=[],missPaper=[];
  days.forEach((d,i)=>{
    const rk='read:'+d;
    if(st.readMin>0&&!doneKeys.has(rk)){const s=takeLate(fr[d],+st.readMin);if(s)add(d,s,{key:rk,kind:'read',ref:null,subject:null,title:'Reading'});else if(i>0&&freeWindows(d).length)missRead.push(d)}
    const pk='paper:'+d;
    if(st.paperMin>0&&!doneKeys.has(pk)){
      const soon=S.tests.filter(t=>t.date>=d&&diffDays(d,t.date)<=14).sort((a,b)=>a.date<b.date?-1:1);
      const sid=soon.length?soon[0].subject:(S.subjects.length?S.subjects[(Math.floor(parse(d)/864e5))%S.subjects.length].id:null);
      const s=takeLate(fr[d],+st.paperMin);
      if(s)add(d,s,{key:pk,kind:'paper',ref:sid,subject:sid,title:`Past paper: ${sub(sid).name}`});else if(i>0&&freeWindows(d).length)missPaper.push(d)}
  });
  // 2. Test preparation: a session on each of the days before a test.
  const tests=S.tests.filter(t=>t.date>=T).sort((a,b)=>a.date<b.date?-1:1);
  for(const t of tests){
    let missed=0;
    for(let i=+st.prepDays;i>=1;i--){
      const d=iso(addDays(parse(t.date),-i));if(d<T||!fr[d])continue;
      const key=`prep:${t.id}:${d}`;if(doneKeys.has(key))continue;
      const min=(+st.prepMin)+(i<=2?15:0);
      const s=takeEarly(fr[d],min)||takeUpTo(fr[d],min,20);
      if(s)add(d,s,{key,kind:'prep',ref:t.id,subject:t.subject,title:`Prep: ${t.title}`});else if(d!==T)missed++;
    }
    if(missed)warnings.push({type:'prep',text:`${missed} prep ${missed===1?'session':'sessions'} for “${t.title}” could not fit. Add free time in the week before ${fmtDate(t.date)}.`});
  }
  // 3. Homework, earliest deadline first, spread across the days before it is due.
  const tasks=openTasks().sort(byNext);
  for(const t of tasks){
    const doneMin=S.doneBlocks.filter(b=>b.kind==='hw'&&b.ref===t.id).reduce((a,b)=>a+b.min,0);
    let rem=Math.max(0,(+t.est||0)-doneMin);if(!rem)continue;
    let last=t.due<=T?T:iso(addDays(parse(t.due),-1));
    if(t.due<T)last=iso(addDays(today(),1));
    const span=days.filter(d=>d<=last);
    if(!span.length){warnings.push({type:'hw',text:`“${t.title}” is due after the planning window, so it isn't scheduled yet.`});continue}
    const perDay=Math.max(+st.maxBlock,Math.ceil(rem/span.length/5)*5);
    for(const d of span){
      let today_=0;
      while(rem>0&&today_<perDay){
        const want=Math.min(rem,+st.maxBlock,perDay-today_);
        const s=takeEarly(fr[d],want)||takeUpTo(fr[d],want,Math.min(20,want));
        if(!s)break;
        add(d,s,{key:`hw:${t.id}:${d}:${s[0]}`,kind:'hw',ref:t.id,subject:t.subject,title:t.title});
        rem-=s[1]-s[0];today_+=s[1]-s[0];
      }
      if(rem<=0)break;
    }
    if(rem>=15)warnings.push({type:'hw',ref:t.id,text:`${fmtMin(rem)} of “${t.title}” doesn't fit before ${t.due<T?'tomorrow':fmtDate(t.due)}. Add free time or lower the estimate.`});
  }
  if(missRead.length&&st.readMin>0)warnings.push({type:'habit',text:`Reading didn't fit on ${missRead.length===1?fmtDate(missRead[0]):missRead.length+' days'}. Those days have no free window long enough.`});
  if(missPaper.length&&st.paperMin>0)warnings.push({type:'habit',text:`Past papers didn't fit on ${missPaper.length===1?fmtDate(missPaper[0]):missPaper.length+' days'}.`});
  blocks.sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:toMin(a.start)-toMin(b.start));
  planCache={blocks,warnings};planStamp=stamp;return planCache;
}
let planVersion=0;
function touch(){planVersion++;save()}
const blocksOn=day=>plan().blocks.filter(b=>b.day===day);
const planColor=b=>b.kind==='read'?'var(--gold)':sub(b.subject).color;

function markBlock(key,on,actual){
  if(on){
    if(S.doneBlocks.some(b=>b.key===key))return;
    const b=plan().blocks.find(x=>x.key===key);if(!b)return;
    const min=Math.max(1,Math.round(actual||b.min));const logId=uid();
    S.log.push({id:logId,date:b.day,subject:b.subject,min,note:b.title});
    const end=actual?fromMin(Math.min(toMin(b.start)+min,24*60-1)):b.end;
    S.doneBlocks.push({key:b.key,kind:b.kind,ref:b.ref,subject:b.subject,title:b.title,day:b.day,start:b.start,end,min,logId});
  }else{
    const b=S.doneBlocks.find(x=>x.key===key);S.doneBlocks=S.doneBlocks.filter(x=>x.key!==key);
    if(b&&b.logId)S.log=S.log.filter(l=>l.id!==b.logId);
  }
  touch();
}

/* =========================================================
   Navigation
   ========================================================= */
const VIEWS=[['dashboard','Dashboard','dash'],['timetable','Timetable','week'],['tasks','Homework','tasks'],['tests','Tests','test'],['calendar','Calendar','cal'],['focus','Focus','focus'],['progress','Progress','prog']];
const VIEWS_B=[['settings','Settings','set'],['integrations','Integrations','int']];
function currentView(){const h=(location.hash||'').replace('#','');return [...VIEWS,...VIEWS_B].some(v=>v[0]===h)?h:'dashboard'}
function renderNav(v){
  const open=openTasks(),late=open.filter(t=>t.due<TD()).length;
  const li=([id,l,i])=>{let c='';
    if(id==='tasks')c=`<span class="count num ${late?'late':''}">${late?late+' late':open.length||''}</span>`;
    if(id==='tests'){const n=S.tests.filter(t=>t.date>=TD()).length;c=`<span class="count num">${n||''}</span>`}
    return `<li><a href="#${id}" class="${v===id?'on':''}" ${v===id?'aria-current="page"':''}>${ic(i)}${l}${c}</a></li>`};
  $('#navTop').innerHTML=VIEWS.map(li).join('');$('#navBottom').innerHTML=VIEWS_B.map(li).join('');
  const all=[...VIEWS,...VIEWS_B].find(x=>x[0]===v);$('#topTitle').textContent=all?all[1]:'';
  renderAcct();
}
function renderAcct(){
  const el=$('#acct');if(!el||!S)return;
  if(!CLOUD){el.innerHTML=`<span>Saved in this browser only.${S.sample?' Showing example data.':''}</span>`;return}
  const lbl={saved:'All changes saved',saving:'Saving…',error:'Offline. Changes kept on this device.'}[syncState];
  el.innerHTML=`<span class="who" title="${esc(user?.email)}">${esc(user?.email||'')}</span><span class="st ${syncState}"><i></i>${lbl}</span>${S.sample?'<span>Showing example data.</span>':''}<button type="button" data-act="signout">Sign out</button>`;
}

/* =========================================================
   Shared pieces
   ========================================================= */
function taskRow(t){
  const late=!t.done&&t.due<TD();
  return `<div class="trow ${t.done?'done':''}">
    <input type="checkbox" class="ck" data-toggle="${t.id}" ${t.done?'checked':''} aria-label="Mark ${esc(t.title)} done">
    <div class="t" title="${esc(t.title)}">${esc(t.title)}<small class="hide-sm">${esc(t.type)}</small>
      <div class="m ${late?'late':''}">${esc(sub(t.subject).name)} · ${relShort(t.due)} · ${fmtMin(t.est)}</div></div>
    <div class="s">${subjMark(t.subject)}</div>
    <div class="d">${dueHTML(t.due,t.done)}</div>
    <div class="e num muted">${fmtMin(t.est)}</div>
    <div><button class="pri ${t.priority}" data-act="pri" data-id="${t.id}" title="Change priority"><i></i><span class="hide-sm">${PRIL[t.priority]}</span></button></div>
  </div>`;
}
function weekChart(){
  const ws=weekStart(today()),T=TD();
  const vals=[...Array(7)].map((_,i)=>({d:iso(addDays(ws,i)),m:minsOn(iso(addDays(ws,i)))}));
  const max=Math.max(180,...vals.map(v=>v.m)),W=280,H=92,bw=22,gap=(W-7*bw)/6,base=H-16;
  let s=`<svg class="chart" viewBox="0 -14 ${W} ${H+14}" role="img" aria-label="Study hours per day this week"><line class="grid" x1="0" x2="${W}" y1="${base}" y2="${base}"/>`;
  vals.forEach((v,i)=>{const x=i*(bw+gap),h=v.m?Math.max(2,(v.m/max)*(base-6)):0;
    s+=`<rect class="b ${v.d===T?'cur':''} ${!v.m?'empty':''}" x="${x}" y="${base-(h||2)}" width="${bw}" height="${h||2}"/>`;
    if(v.m)s+=`<text class="vl" x="${x+bw/2}" y="${base-h-4}" text-anchor="middle">${(v.m/60).toFixed(1)}</text>`;
    s+=`<text class="ax" x="${x+bw/2}" y="${H-2}" text-anchor="middle">${DOW[(i+1)%7][0]}</text>`});
  return s+'</svg>';
}
function dayPicker(group,sel){return `<div class="days" role="group" aria-label="Days">${WEEK.map(d=>`<button type="button" data-act="pick" data-g="${group}" data-d="${d}" class="${sel.includes(d)?'on':''}" aria-pressed="${sel.includes(d)}">${DOW[d].slice(0,2)}</button>`).join('')}</div>`}
function planRow(b,opts={}){
  const T=TD(),past=b.day===T&&!b.done&&toMin(b.end)<=nowHM();
  return `<div class="prow ${b.done?'done':''} ${past?'past':''}">
    <input type="checkbox" class="ck" data-block="${esc(b.key)}" ${b.done?'checked':''} aria-label="Mark ${esc(b.title)} done">
    <span class="tm num">${opts.showDay?(b.day===T?'Today':fmtDate(b.day).slice(0,3)+' '+parse(b.day).getDate())+' · ':''}${b.start}–${b.end}</span>
    <span class="tt">${esc(b.title)}<small>${PLANL[b.kind]}${b.subject?' · '+esc(sub(b.subject).name):''} · ${fmtMin(b.min)}</small></span>
    <span class="kind plan">Planned</span>
    ${b.done?'<span></span>':`<button class="btn ghost sm" data-act="focus-block" data-key="${esc(b.key)}">Start</button>`}
  </div>`;
}
function fixedRow(e){
  return `<div class="prow fixed"><i class="dot" style="background:${e.kind==='test'?'var(--red)':e.kind==='personal'?'var(--personal)':e.subject?esc(sub(e.subject).color):'var(--school)'}"></i>
    <span class="tm num">${e.allDay?'All day':e.start+'–'+e.end}</span>
    <span class="tt">${esc(e.title)}${e.room||e.kind!=='class'?`<small>${e.room?esc(e.room):''}${e.room&&e.kind!=='class'?' · ':''}${e.kind!=='class'?KINDS[e.kind]:''}</small>`:''}</span>
    <span class="kind ${e.kind}">${KINDS[e.kind]||''}</span></div>`;
}

/* =========================================================
   Dashboard
   ========================================================= */
function setupSteps(){
  const steps=[
    [S.classes.length>0,'Add your classes','Upload your timetable or enter it period by period.','timetable','Add classes'],
    [!S.freeDefault,'Set the times you are free','Planned sessions only go into these windows.','timetable','Set free time'],
    [S.tasks.length>0,'Add homework','With the due date and how long it will take.','tasks','Add homework'],
    [S.tests.length>0,'Add upcoming tests','Prep sessions start a week before each one.','tests','Add tests']];
  return steps;
}
function vDashboard(){
  const T=TD(),now=new Date(),hr=now.getHours(),nm=nowHM();
  const P=plan(),open=openTasks().sort(byNext);
  const late=open.filter(t=>t.due<T);
  const upTests=S.tests.filter(t=>t.date>=T).sort((a,b)=>a.date<b.date?-1:1);
  const wk=weekMins(0),goal=(+S.settings.goal||14)*60;
  const greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
  const name=S.settings.name?`, ${esc(S.settings.name)}`:'';
  const todayBlocks=blocksOn(T),todayFixed=fixedOn(T);
  const planMin=todayBlocks.reduce((a,b)=>a+b.min,0),doneMin=todayBlocks.filter(b=>b.done).reduce((a,b)=>a+b.min,0);
  const next=P.blocks.find(b=>!b.done&&(b.day>T||(b.day===T&&toMin(b.end)>nm)));
  const steps=setupSteps(),setupLeft=steps.filter(s=>!s[0]).length;
  const merged=[...todayFixed.map(e=>({t:e.allDay?-1:toMin(e.start),h:fixedRow(e)})),...todayBlocks.map(b=>({t:toMin(b.start),h:planRow(b)}))].sort((a,b)=>a.t-b.t);
  const upcoming=P.blocks.filter(b=>!b.done&&b.day>T).slice(0,5);
  const ws=weekStart(today()),habitDays=[...Array(7)].map((_,i)=>iso(addDays(ws,i)));
  const hasDone=(k,d)=>S.doneBlocks.some(b=>b.kind===k&&b.day===d);
  const habitRow=(k,l)=>`<div class="habit"><span>${l}</span>${habitDays.map(d=>`<i class="${hasDone(k,d)?'y':''} ${d===T?'t':''} ${d>T?'f':''}" title="${fmtDate(d)}"></i>`).join('')}</div>`;

  return `
  <div class="phead">
    <div><h1>${greet}${name}</h1><div class="sub">${DOWL[now.getDay()]} ${now.getDate()} ${MONL[now.getMonth()]} ${now.getFullYear()} · Week ${isoWeek(now)}</div></div>
    <dl class="overview num">
      <div><dt>Planned today</dt><dd>${fmtMin(planMin)}</dd></div>
      <div><dt>Done today</dt><dd>${fmtMin(doneMin)}</dd></div>
      <div><dt>Overdue</dt><dd class="${late.length?'red':''}">${late.length}</dd></div>
      <div><dt>Tests in 10 days</dt><dd>${upTests.filter(t=>diffDays(T,t.date)<=10).length}</dd></div>
    </dl>
  </div>
  <div class="grid2">
    <div>
      ${setupLeft?`<section class="sec"><div class="sh"><h2>Set up your planner</h2><span class="aside num">${4-setupLeft} of 4 done</span></div>
        <div class="steps">${steps.map(([ok,t,d,v,l])=>`<div class="step ${ok?'ok':''}"><div><b>${t}</b><small>${d}</small></div>${ok?'<span></span>':`<a class="btn sec2 sm" href="#${v}">${l}</a>`}</div>`).join('')}</div>
        ${!S.classes.length&&!S.tasks.length?`<div style="padding:12px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">Want to see how it works first?</span><button class="btn ghost sm" data-act="confirm" data-c="example" style="padding:0">Load an example week</button>${ui.confirm==='example'?'<button class="btn danger sm" data-act="do-example">Replace my data with the example</button>':''}</div>`:''}
      </section>`:''}
      ${next?`<div class="next">
        <div><div class="label">${next.day===T&&toMin(next.start)<=nm?'Now':'Next'}</div><h3>${esc(next.title)}</h3>
          <div class="meta">${next.subject?subjMark(next.subject):'<span>General</span>'}<span class="num">${next.day===T?'Today':fmtDate(next.day)}, ${next.start}–${next.end}</span><span>${PLANL[next.kind]}</span></div></div>
        <div><button class="btn" data-act="focus-block" data-key="${esc(next.key)}">${ic('play')}Start focus</button></div></div>`:''}

      <section class="sec">
        <div class="sh"><h2>Today</h2><a class="aside" href="#calendar">Week view</a></div>
        ${merged.length?merged.map(x=>x.h).join(''):`<div class="empty">Nothing planned today${S.free.some(f=>f.dow===now.getDay())?'.':'. You have no free time set for '+DOWL[now.getDay()]+'.'}</div>`}
      </section>

      <section class="sec">
        <div class="sh"><h2>Homework</h2><a class="aside" href="#tasks">${open.length?`All ${open.length} open`:'Add homework'}</a></div>
        <div class="rows">${open.slice(0,6).map(taskRow).join('')||'<div class="empty">No homework to do.</div>'}</div>
      </section>

      <section class="sec">
        <div class="sh"><h2>Coming up</h2><span class="aside">Next planned sessions</span></div>
        ${upcoming.map(b=>planRow(b,{showDay:true})).join('')||'<div class="empty">No further sessions planned.</div>'}
      </section>
    </div>

    <div class="col2">
      ${P.warnings.length?`<section class="sec"><div class="sh"><h2>Plan needs attention</h2><span class="aside num">${P.warnings.length}</span></div>${P.warnings.map(w=>`<div class="warn"><span>${esc(w.text)}</span></div>`).join('')}</section>`:''}
      <section class="sec">
        <div class="sh"><h2>Upcoming tests</h2><a class="aside" href="#tests">All tests</a></div>
        ${upTests.slice(0,4).map(t=>{const n=diffDays(T,t.date);const pr=P.blocks.filter(b=>b.kind==='prep'&&b.ref===t.id);return `<div class="cd"><div class="n num ${n<=2?'soon':''}">${n}<small>${n===1?'day':'days'}</small></div>
          <div class="x">${esc(t.title)}<small>${esc(sub(t.subject).name)} · ${fmtDate(t.date)}, ${t.time}</small>
          <div class="bar gold" style="margin-top:6px"><span style="width:${t.prep}%"></span></div><small>Prepared ${t.prep}% · ${pr.filter(b=>b.done).length} of ${pr.length} prep sessions done</small></div></div>`}).join('')||'<div class="empty">No tests scheduled.</div>'}
      </section>
      <section class="sec">
        <div class="sh"><h2>Daily habits this week</h2></div>
        <div class="habit hd"><span></span>${['M','T','W','T','F','S','S'].map(x=>`<span>${x}</span>`).join('')}</div>
        ${habitRow('read',`Reading · ${S.settings.readMin} min`)}${habitRow('paper',`Past papers · ${S.settings.paperMin} min`)}
      </section>
      <section class="sec">
        <div class="sh"><h2>Weekly study hours</h2><span class="aside num">Goal ${S.settings.goal} h</span></div>
        <div class="big num"><b>${fmtH(wk)}</b><span class="muted">of ${S.settings.goal} h · ${Math.round(wk/goal*100)}%</span></div>
        <div class="bar" style="margin:8px 0 14px"><span style="width:${Math.min(100,wk/goal*100)}%"></span></div>
        ${weekChart()}
      </section>
    </div>
  </div>`;
}

/* =========================================================
   Timetable: classes and free time
   ========================================================= */
function normTime(s){s=String(s||'').trim().toLowerCase();const m=s.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/)||s.match(/^(\d{2})(\d{2})$/);if(!m)return null;
  let h=+m[1],mi=+(m[2]||0);if(m[3]==='pm'&&h<12)h+=12;if(m[3]==='am'&&h===12)h=0;if(h>23||mi>59)return null;return `${pad(h)}:${pad(mi)}`}
function dayOf(s){s=String(s||'').trim().toLowerCase();if(/^[1-7]$/.test(s))return +s%7;const i=['sun','mon','tue','wed','thu','fri','sat'].indexOf(s.slice(0,3));return i}
function importClasses(txt){
  const rows=txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(l=>l.split(/\t|;|,/).map(c=>c.trim().replace(/^"|"$/g,'')));
  if(!rows.length)return{added:0,skipped:0};
  let cols={day:0,start:1,end:2,subject:3,room:4};
  const head=rows[0].map(c=>c.toLowerCase());
  if(head.some(c=>c==='day'||c==='subject')){rows.shift();const f=n=>head.findIndex(c=>c.startsWith(n));cols={day:f('day'),start:f('start'),end:f('end'),subject:f('subj'),room:f('room')}}
  let added=0,skipped=0;
  for(const r of rows){
    const d=dayOf(r[cols.day]),s=normTime(r[cols.start]),e=normTime(r[cols.end]),name=(r[cols.subject]||'').trim();
    if(d<0||!s||!e||!name||toMin(e)<=toMin(s)){skipped++;continue}
    let sj=S.subjects.find(x=>x.name.toLowerCase()===name.toLowerCase());
    if(!sj){sj={id:uid(),name,color:PALETTE[S.subjects.length%PALETTE.length]};S.subjects.push(sj)}
    const room=cols.room>=0?(r[cols.room]||''):'';
    const same=S.classes.find(c=>c.subject===sj.id&&c.start===s&&c.end===e&&(c.room||'')===room);
    if(same){if(!same.dow.includes(d))same.dow.push(d)}else S.classes.push({id:uid(),subject:sj.id,dow:[d],start:s,end:e,room});
    added++;
  }
  return{added,skipped};
}
function vTimetable(){
  const cls=[...S.classes].sort((a,b)=>Math.min(...a.dow.map(d=>(d+6)%7))-Math.min(...b.dow.map(d=>(d+6)%7))||toMin(a.start)-toMin(b.start));
  const clsMin=S.classes.reduce((a,c)=>a+c.dow.length*(toMin(c.end)-toMin(c.start)),0);
  return `<div class="phead"><div><h1>Timetable</h1><div class="sub">Your classes and the hours you're free. Quire plans study only inside free time and never over a class.</div></div>
    <dl class="overview num"><div><dt>Class time per week</dt><dd>${fmtH(clsMin)}</dd></div><div><dt>Free time per week</dt><dd>${fmtH(freeMinsWeek())}</dd></div></dl></div>

  <section class="sec" style="border:0">
    <div class="sh"><h2>Upload your classes</h2></div>
    <div class="drop" id="drop">
      <div style="min-width:0;flex:1 1 320px"><b style="font-weight:500">Drop a CSV file here, or choose one.</b>
        <div class="muted" style="font-size:12.5px;margin-top:3px">Columns: <code class="fmt">Day, Start, End, Subject, Room</code>. Export from Excel or Google Sheets as CSV. <a href="timetable-template.csv" download>Download a template</a>.</div></div>
      <label class="btn sec2" style="position:relative;overflow:hidden">${ic('up')}Choose file<input type="file" id="clsFile" accept=".csv,.tsv,.txt,text/csv" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>
    </div>
    <details style="margin-top:10px"><summary class="muted" style="cursor:pointer;font-size:13px">Or paste your timetable as text</summary>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px"><textarea class="in" id="clsPaste" rows="5" placeholder="Mon, 08:00, 08:45, Mathematics, Room 12&#10;Mon, 08:45, 09:30, Physics, Lab 2"></textarea>
      <div><button class="btn sec2" data-act="paste-classes">Add these classes</button></div></div></details>
    <div id="clsMsg" class="ok" style="margin-top:8px">${ui.flash&&ui.flash.startsWith('cls:')?esc(ui.flash.slice(4)):''}</div>
  </section>

  <section class="sec">
    <div class="sh"><h2>Classes</h2><span class="aside num">${S.classes.length} ${S.classes.length===1?'entry':'entries'}</span></div>
    <form class="form cls" id="clsForm" autocomplete="off">
      <label class="field f-title"><span>Subject</span><select class="in" id="cf-sub">${S.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
      <div class="field f-days"><span>Days</span>${dayPicker('cls',ui.pick.cls)}</div>
      <label class="field"><span>Start</span><input class="in num" type="time" id="cf-s" required value="08:00"></label>
      <label class="field"><span>End</span><input class="in num" type="time" id="cf-e" required value="08:45"></label>
      <label class="field"><span>Room</span><input class="in" id="cf-room" placeholder="Optional"></label>
      <div class="acts"><button class="btn" type="submit">Add class</button></div>
    </form>
    ${cls.length?`<div class="tw" style="margin-top:12px"><table><thead><tr><th>Days</th><th>Time</th><th>Subject</th><th class="hide-sm">Room</th><th></th></tr></thead><tbody>
      ${cls.map(c=>`<tr><td>${[...c.dow].sort((a,b)=>(a+6)%7-(b+6)%7).map(d=>DOW[d]).join(', ')}</td><td class="num">${c.start}–${c.end}</td><td>${subjMark(c.subject)}</td><td class="hide-sm muted">${esc(c.room||'')}</td>
      <td class="r"><span class="rowact"><button class="icon" data-act="del-class" data-id="${c.id}" aria-label="Delete">${ic('del')}</button></span></td></tr>`).join('')}</tbody></table></div>
      <div style="padding:10px 0">${ui.confirm==='clear-classes'?'<button class="btn danger sm" data-act="do-clear-classes">Confirm: remove all classes</button> <button class="btn sec2 sm" data-act="confirm" data-c="">Cancel</button>':'<button class="btn ghost sm" style="padding:0" data-act="confirm" data-c="clear-classes">Remove all classes</button>'}</div>`
      :'<div class="empty">No classes yet. Upload a file or add them above.</div>'}
  </section>

  <section class="sec">
    <div class="sh"><h2>When you're free to study</h2><span class="aside">${S.freeDefault?'These are starting suggestions. Change them to match your week.':'Study is only planned in these windows'}</span></div>
    <form class="form fr" id="freeForm" autocomplete="off">
      <div class="field f-days"><span>Days</span>${dayPicker('free',ui.pick.free)}</div>
      <label class="field"><span>From</span><input class="in num" type="time" id="ff-s" required value="16:00"></label>
      <label class="field"><span>To</span><input class="in num" type="time" id="ff-e" required value="19:00"></label>
      <div class="acts"><button class="btn" type="submit">Add free time</button></div>
    </form>
    <div class="tw" style="margin-top:12px"><table><thead><tr><th>Day</th><th>Free windows</th><th class="r">Total</th></tr></thead><tbody>
      ${WEEK.map(d=>{const w=S.free.filter(f=>f.dow===d).sort((a,b)=>toMin(a.start)-toMin(b.start));const tot=w.reduce((a,f)=>a+toMin(f.end)-toMin(f.start),0);
        return `<tr><td style="width:110px">${DOWL[d]}</td><td><div class="chips">${w.map(f=>`<span class="chip num">${f.start}–${f.end}<button type="button" data-act="del-free" data-id="${f.id}" aria-label="Remove ${f.start} to ${f.end}">×</button></span>`).join('')||'<span class="muted">Not free</span>'}</div></td><td class="r num muted">${tot?fmtMin(tot):'–'}</td></tr>`}).join('')}
    </tbody></table></div>
    <p class="muted" style="font-size:12.5px;margin:10px 0 0">Classes, tests and personal commitments inside a free window are worked around automatically.</p>
  </section>

  <section class="sec">
    <div class="sh"><h2>Other commitments</h2><span class="aside">Sport, tuition, family time</span></div>
    <form class="form fr" id="commitForm" autocomplete="off" style="grid-template-columns:minmax(0,1.4fr) auto repeat(2,minmax(0,120px)) auto">
      <label class="field f-title"><span>What</span><input class="in" id="kf-title" required placeholder="e.g. Badminton practice"></label>
      <div class="field f-days"><span>Every</span>${dayPicker('commit',ui.pick.commit)}</div>
      <label class="field"><span>From</span><input class="in num" type="time" id="kf-s" required value="17:00"></label>
      <label class="field"><span>To</span><input class="in num" type="time" id="kf-e" required value="18:00"></label>
      <div class="acts"><button class="btn" type="submit">Add</button></div>
    </form>
    ${S.events.filter(e=>e.dow).map(e=>`<div class="lrow" style="grid-template-columns:150px minmax(0,1fr) auto"><span class="tm num">${e.dow.map(d=>DOW[d]).join(', ')} · ${e.start}</span><span class="tt">${esc(e.title)}<small class="num">${e.start}–${e.end}</small></span><button class="icon" data-act="del-ev" data-id="${e.id}" aria-label="Delete">${ic('del')}</button></div>`).join('')}
  </section>`;
}

/* =========================================================
   Homework
   ========================================================= */
function taskForm(){
  const e=ui.editTask?S.tasks.find(t=>t.id===ui.editTask):null;
  const v=e||{title:'',subject:S.subjects[0]?.id,due:iso(addDays(today(),1)),est:30,priority:'med',type:'Homework'};
  return `<div class="formhead"><span class="label">${e?'Edit homework':'Add homework'}</span></div>
  <form class="form" id="taskForm" autocomplete="off">
    <label class="field f-title"><span>What is it?</span><input class="in" id="tf-title" required value="${esc(v.title)}" placeholder="e.g. Chapter 6 questions 1 to 14"></label>
    <label class="field"><span>Subject</span><select class="in" id="tf-sub">${S.subjects.map(s=>`<option value="${s.id}" ${s.id===v.subject?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    <label class="field"><span>Due</span><input class="in num" type="date" id="tf-due" required value="${v.due}"></label>
    <label class="field"><span>Time needed (min)</span><input class="in num" type="number" min="5" step="5" id="tf-est" required value="${v.est}"></label>
    <label class="field"><span>Priority</span><select class="in" id="tf-pri">${['high','med','low'].map(p=>`<option value="${p}" ${p===v.priority?'selected':''}>${PRIL[p]}</option>`).join('')}</select></label>
    <label class="field"><span>Type</span><select class="in" id="tf-type">${['Homework','Assignment','Project','Revision'].map(p=>`<option ${p===v.type?'selected':''}>${p}</option>`).join('')}</select></label>
    <div class="acts"><button class="btn" type="submit">${e?'Save':'Add'}</button>${e?'<button class="btn sec2" type="button" data-act="cancel-edit">Cancel</button>':''}</div>
  </form>`;
}
function tasksBody(){
  const f=ui.taskF,q=f.q.trim().toLowerCase(),P=plan();
  let list=S.tasks.filter(t=>(f.subject==='all'||t.subject===f.subject)&&(f.status==='all'||(f.status==='open'?!t.done:t.done))&&(!q||t.title.toLowerCase().includes(q)));
  const k=ui.sort.key,d=ui.sort.dir;
  const val=t=>k==='due'?t.due:k==='est'?t.est:k==='pri'?PRI[t.priority]:k==='subject'?sub(t.subject).name:t.title.toLowerCase();
  list.sort((a,b)=>{const x=val(a),y=val(b);return (x<y?-1:x>y?1:byNext(a,b))*d});
  if(!list.length)return `<tr><td colspan="7" class="empty">${S.tasks.length?'No homework matches these filters.':'No homework yet. Add your first piece above.'}</td></tr>`;
  return list.map(t=>{
    const bl=P.blocks.filter(b=>b.kind==='hw'&&b.ref===t.id),doneM=bl.filter(b=>b.done).reduce((a,b)=>a+b.min,0);
    const first=bl.find(b=>!b.done),short=P.warnings.some(w=>w.ref===t.id);
    const sched=t.done?'':short?'<small class="red" style="display:block;font-size:11.5px">Not enough free time</small>':first?`<small class="muted" style="display:block;font-size:11.5px">Planned ${first.day===TD()?'today':fmtDate(first.day)} ${first.start}${bl.filter(b=>!b.done).length>1?` +${bl.filter(b=>!b.done).length-1}`:''}</small>`:'';
    return `<tr class="${t.done?'done':''}">
    <td class="c"><input type="checkbox" class="ck" data-toggle="${t.id}" ${t.done?'checked':''} aria-label="Mark done"></td>
    <td class="title">${esc(t.title)}<small>${esc(t.type)}</small></td>
    <td>${subjMark(t.subject)}</td>
    <td>${dueHTML(t.due,t.done)}</td>
    <td class="r num muted">${fmtMin(t.est)}${doneM&&!t.done?`<small style="display:block;font-size:11.5px">${fmtMin(doneM)} done</small>`:''}</td>
    <td class="hide-sm">${sched||'<span class="muted">–</span>'}</td>
    <td><button class="pri ${t.priority}" data-act="pri" data-id="${t.id}" title="Change priority"><i></i>${PRIL[t.priority]}</button></td>
    <td class="r"><span class="rowact"><button class="icon" data-act="edit-task" data-id="${t.id}" aria-label="Edit">${ic('edit')}</button><button class="icon" data-act="del-task" data-id="${t.id}" aria-label="Delete">${ic('del')}</button></span></td></tr>`}).join('');
}
function th(key,label,cls=''){const on=ui.sort.key===key;return `<th class="${cls}"><button class="${on?'on':''}" data-act="sort" data-key="${key}">${label}<span class="ar">${on?(ui.sort.dir>0?'↑':'↓'):''}</span></button></th>`}
function vTasks(){
  const open=openTasks(),T=TD(),late=open.filter(t=>t.due<T).length,mins=open.reduce((a,t)=>a+(+t.est||0),0);
  return `<div class="phead"><div><h1>Homework</h1><div class="sub">Add what's due and how long it will take. Quire splits it into sessions that finish the day before.</div></div>
    <dl class="overview num"><div><dt>Open</dt><dd>${open.length}</dd></div><div><dt>Overdue</dt><dd class="${late?'red':''}">${late}</dd></div><div><dt>Time needed</dt><dd>${fmtMin(mins)}</dd></div></dl></div>
  ${S.subjects.length?taskForm():'<div class="empty">Add a subject in Settings first.</div>'}
  <div class="toolbar">
    <label class="field q"><span>Search</span><input class="in" id="tq" value="${esc(ui.taskF.q)}" placeholder="Filter by title"></label>
    <label class="field"><span>Subject</span><select class="in" id="tsub"><option value="all">All subjects</option>${S.subjects.map(s=>`<option value="${s.id}" ${ui.taskF.subject===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
    <div class="field"><span>Status</span><div class="seg" role="group">${['open','done','all'].map(s=>`<button type="button" data-act="status" data-s="${s}" class="${ui.taskF.status===s?'on':''}">${cap(s)}</button>`).join('')}</div></div>
  </div>
  <div class="tw"><table><thead><tr><th class="c"></th>${th('title','Homework')}${th('subject','Subject')}${th('due','Due')}${th('est','Time','r')}<th class="hide-sm">Scheduled</th>${th('pri','Priority')}<th></th></tr></thead><tbody id="tbody">${tasksBody()}</tbody></table></div>`;
}

/* =========================================================
   Tests
   ========================================================= */
function vTests(){
  const T=TD(),P=plan(),list=[...S.tests].sort((a,b)=>a.date<b.date?-1:1),up=list.filter(t=>t.date>=T),past=list.filter(t=>t.date<T);
  const avg=up.length?Math.round(up.reduce((a,t)=>a+t.prep,0)/up.length):0;
  const row=t=>{const n=diffDays(T,t.date),pr=P.blocks.filter(b=>b.kind==='prep'&&b.ref===t.id);return `<tr>
    <td class="title">${esc(t.title)}<small>${fmtMin(t.dur||60)}</small></td><td>${subjMark(t.subject)}</td>
    <td class="num">${fmtDate(t.date)}<small class="muted" style="display:block;font-size:11.5px">${t.time}</small></td>
    <td class="r num ${n<=2?'red':''}">${n===0?'Today':n+' d'}</td>
    <td class="num hide-sm">${pr.filter(b=>b.done).length} / ${pr.length}<small class="muted" style="display:block;font-size:11.5px">${fmtMin(pr.reduce((a,b)=>a+b.min,0))} planned</small></td>
    <td style="min-width:160px"><div style="display:flex;gap:10px;align-items:center"><input class="range" type="range" min="0" max="100" step="5" value="${t.prep}" data-prep="${t.id}" aria-label="How prepared"><span class="num muted" style="width:34px;text-align:right" id="pp-${t.id}">${t.prep}%</span></div></td>
    <td class="r"><span class="rowact"><button class="icon" data-act="del-test" data-id="${t.id}" aria-label="Delete">${ic('del')}</button></span></td></tr>`};
  return `<div class="phead"><div><h1>Tests</h1><div class="sub">Each test gets a prep session on each of the ${S.settings.prepDays} days before it, longer in the final two days.</div></div>
    <dl class="overview num"><div><dt>Upcoming</dt><dd>${up.length}</dd></div><div><dt>Within 7 days</dt><dd>${up.filter(t=>diffDays(T,t.date)<=7).length}</dd></div><div><dt>Average readiness</dt><dd>${avg}%</dd></div></dl></div>
  <div class="formhead"><span class="label">Add test</span></div>
  <form class="form" id="testForm" autocomplete="off">
    <label class="field f-title"><span>Test</span><input class="in" id="xf-title" required placeholder="e.g. Unit test: Electrostatics"></label>
    <label class="field"><span>Subject</span><select class="in" id="xf-sub">${S.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
    <label class="field"><span>Date</span><input class="in num" type="date" id="xf-date" required value="${iso(addDays(today(),10))}"></label>
    <label class="field"><span>Start</span><input class="in num" type="time" id="xf-time" value="09:00"></label>
    <label class="field"><span>Length (min)</span><input class="in num" type="number" min="10" step="5" id="xf-dur" value="60"></label>
    <label class="field"><span>Readiness (%)</span><input class="in num" type="number" min="0" max="100" step="5" id="xf-prep" value="0"></label>
    <div class="acts"><button class="btn" type="submit">Add</button></div>
  </form>
  <section class="sec" style="border:0"><div class="sh"><h2>Upcoming</h2></div>
  <div class="tw"><table><thead><tr><th>Test</th><th>Subject</th><th>Date</th><th class="r">In</th><th class="hide-sm">Prep sessions</th><th>Readiness</th><th></th></tr></thead>
  <tbody>${up.map(row).join('')||'<tr><td colspan="7" class="empty">No upcoming tests.</td></tr>'}</tbody></table></div></section>
  ${past.length?`<section class="sec"><div class="sh"><h2>Past</h2></div><div class="tw"><table><tbody>${past.reverse().map(t=>`<tr><td class="title">${esc(t.title)}</td><td>${subjMark(t.subject)}</td><td class="num">${fmtDate(t.date)}</td><td class="r"><button class="icon" data-act="del-test" data-id="${t.id}" aria-label="Delete">${ic('del')}</button></td></tr>`).join('')}</tbody></table></div></section>`:''}`;
}

/* =========================================================
   Calendar
   ========================================================= */
const H0=6,H1=23,HH=46;
function layoutDay(evs){
  const ev=evs.filter(e=>!e.allDay).map(e=>({...e,s:Math.max(toMin(e.start),H0*60),e2:Math.min(toMin(e.end),H1*60)})).filter(e=>e.e2>e.s).sort((a,b)=>a.s-b.s||b.e2-a.e2);
  let cluster=[],cEnd=-1;const out=[];
  const flush=()=>{const lanes=[];for(const e of cluster){let i=lanes.findIndex(end=>end<=e.s);if(i<0){i=lanes.length;lanes.push(0)}lanes[i]=e.e2;e.lane=i}cluster.forEach(e=>{e.n=lanes.length;out.push(e)});cluster=[]};
  for(const e of ev){if(e.s>=cEnd&&cluster.length)flush();cluster.push(e);cEnd=Math.max(cEnd,e.e2)}
  if(cluster.length)flush();return out;
}
function evColor(e){if(e.src==='plan')return planColor(e);return e.kind==='test'?'var(--red)':e.kind==='personal'?'var(--personal)':e.subject?sub(e.subject).color:'var(--school)'}
function vCalendar(){
  const ws=weekStart(addDays(today(),ui.week*7)),T=TD(),we=addDays(ws,6);
  const days=[...Array(7)].map((_,i)=>iso(addDays(ws,i)));
  const range=ws.getMonth()===we.getMonth()?`${ws.getDate()}–${we.getDate()} ${MONL[we.getMonth()]} ${we.getFullYear()}`:`${ws.getDate()} ${MON[ws.getMonth()]} – ${we.getDate()} ${MON[we.getMonth()]} ${we.getFullYear()}`;
  const P=plan();
  const planned=P.blocks.filter(b=>b.day>=days[0]&&b.day<=days[6]);
  let g=`<div class="corner"></div>`;
  days.forEach(d=>{const x=parse(d);g+=`<div class="dh ${d===T?'today':''}"><b>${DOW[x.getDay()]}</b><span class="num">${x.getDate()}</span></div>`});
  g+=`<div class="corner2">All day</div>`;
  days.forEach(d=>{const a=fixedOn(d).filter(e=>e.allDay);g+=`<div class="ad">${a.map(e=>`<div title="${esc(e.title)}">${esc(e.title)}</div>`).join('')}</div>`});
  g+=`<div class="hours">${[...Array(H1-H0)].map((_,i)=>`<div class="num">${i?pad(H0+i)+':00':''}</div>`).join('')}</div>`;
  const nm=nowHM();
  days.forEach(d=>{
    g+=`<div class="day ${d===T?'today':''}" style="height:${(H1-H0)*HH}px">`;
    for(const[a,b] of freeWindows(d)){const s=Math.max(a,H0*60),e=Math.min(b,H1*60);if(e>s)g+=`<div class="freebg" style="top:${(s-H0*60)/60*HH}px;height:${(e-s)/60*HH}px"></div>`}
    const items=[...fixedOn(d),...planned.filter(b=>b.day===d).map(b=>({...b,src:'plan',id:b.key}))];
    for(const e of layoutDay(items)){
      const top=(e.s-H0*60)/60*HH,h=Math.max(18,(e.e2-e.s)/60*HH-2),w=100/e.n;
      const key=e.src+'|'+e.id+'|'+d,lbl=e.src==='plan'?PLANL[e.kind]:KINDS[e.kind];
      g+=`<button class="ev ${e.kind} ${e.src==='plan'?'plan':''} ${e.done?'done':''} ${ui.selEvent===key?'sel':''}" style="--c:${evColor(e)};top:${top}px;height:${h}px;left:calc(${e.lane*w}% + 2px);width:calc(${w}% - 4px)" data-act="sel-ev" data-key="${esc(key)}" title="${esc(e.title)} ${e.start}–${e.end}">
        ${h>30?`<span class="k">${lbl}</span>`:''}<b>${esc(e.title)}</b>${h>50?`<small class="num">${e.start}–${e.end}${e.room?' · '+esc(e.room):''}</small>`:''}</button>`;
    }
    if(d===T&&nm>=H0*60&&nm<=H1*60)g+=`<div class="nowline" style="top:${(nm-H0*60)/60*HH}px"></div>`;
    g+=`</div>`;
  });
  let detail='';
  if(ui.selEvent){const[src,id,day]=ui.selEvent.split('|');
    const e=src==='plan'?P.blocks.find(b=>b.key===id):fixedOn(day).find(x=>x.id===id&&x.src===src);
    if(e){const lbl=src==='plan'?PLANL[e.kind]:KINDS[e.kind];
      let acts='';
      if(src==='plan')acts=e.done?`<button class="btn sec2 sm" data-act="block-undo" data-key="${esc(id)}">Mark not done</button>`:`<button class="btn sm" data-act="focus-block" data-key="${esc(id)}">${ic('play')}Start focus</button><button class="btn sec2 sm" data-act="block-done" data-key="${esc(id)}">Mark done</button>`;
      else if(src==='test')acts='<a class="btn sec2 sm" href="#tests">Edit in Tests</a>';
      else if(src==='class')acts='<a class="btn sec2 sm" href="#timetable">Edit timetable</a>';
      else acts=`<button class="btn danger sm" data-act="del-ev" data-id="${id}">${e.dow?'Delete every week':'Delete'}</button>`;
      detail=`<div class="evdetail"><div><span class="kind ${e.kind}">${lbl}${src==='plan'?' · planned automatically':''}</span><h3>${esc(e.title)}</h3>
      <div class="muted num" style="font-size:13px">${fmtDate(day)} · ${e.allDay?'All day':e.start+'–'+e.end}${e.subject?' · '+esc(sub(e.subject).name):''}${e.room?' · '+esc(e.room):''}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${acts}<button class="btn sec2 sm" data-act="sel-ev" data-key="">Close</button></div></div>`}}
  const pm=planned.reduce((a,b)=>a+b.min,0);
  return `<div class="phead"><div><h1>Calendar</h1><div class="sub">Classes and commitments, with study sessions planned into your free time (shaded). Tap a block for details.</div></div>
    <dl class="overview num"><div><dt>Study planned this week</dt><dd>${fmtH(pm)}</dd></div><div><dt>Tests this week</dt><dd>${S.tests.filter(t=>t.date>=days[0]&&t.date<=days[6]).length}</dd></div></dl></div>
  <div class="calbar"><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><h2 class="num">${range}</h2>
    <div class="nav2"><button class="btn sec2 sm" data-act="wk" data-d="-1" aria-label="Previous week">${ic('l')}</button><button class="btn sec2 sm" data-act="wk" data-d="0">This week</button><button class="btn sec2 sm" data-act="wk" data-d="1" aria-label="Next week">${ic('r')}</button></div></div>
    <div class="legend"><span><i style="border-color:var(--school);background:color-mix(in srgb,var(--school) 13%,var(--surface))"></i>Class</span><span><i style="border-color:var(--blue);background:var(--surface);outline:1px solid color-mix(in srgb,var(--blue) 45%,transparent)"></i>Planned study</span><span><i style="border-color:var(--red);background:color-mix(in srgb,var(--red) 13%,var(--surface))"></i>Test</span><span><i style="border-color:var(--personal);background:color-mix(in srgb,var(--personal) 13%,var(--surface))"></i>Personal</span><span><i style="border-color:transparent;background:color-mix(in srgb,var(--blue) 10%,var(--surface))"></i>Free time</span></div></div>
  ${detail}
  <div class="calwrap" id="calwrap"><div class="cal">${g}</div></div>
  <div class="formhead"><span class="label">Add a one-off event</span></div>
  <form class="form" id="evForm" autocomplete="off" style="grid-template-columns:minmax(0,2fr) repeat(4,minmax(0,1fr)) auto">
    <label class="field f-title"><span>Title</span><input class="in" id="ef-title" required placeholder="e.g. Dentist, school trip"></label>
    <label class="field"><span>Type</span><select class="in" id="ef-kind"><option value="personal">Personal</option><option value="school">School</option></select></label>
    <label class="field"><span>Date</span><input class="in num" type="date" id="ef-day" required value="${T>=days[0]&&T<=days[6]?T:days[0]}"></label>
    <label class="field"><span>Start</span><input class="in num" type="time" id="ef-s" required value="16:00"></label>
    <label class="field"><span>End</span><input class="in num" type="time" id="ef-e" required value="17:00"></label>
    <div class="acts"><button class="btn" type="submit">Add</button></div>
  </form>`;
}

/* =========================================================
   Focus timer
   ========================================================= */
const F={blockKey:null,taskId:null,subject:null,len:45,remaining:45*60000,running:false,endAt:0,seg:0,accrued:0,started:false,msg:null,doneTask:null};
function clockTxt(ms){const s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}:${pad(m)}:${pad(x)}`:`${pad(m)}:${pad(x)}`}
function focusCtx(){
  const b=F.blockKey?plan().blocks.find(x=>x.key===F.blockKey):null;
  const t=b&&b.kind==='hw'?S.tasks.find(x=>x.id===b.ref):F.taskId?S.tasks.find(x=>x.id===F.taskId):null;
  const sid=b?b.subject:t?t.subject:F.subject;
  const title=b?b.title:t?t.title:'General study';
  return{b,t,sid,title};
}
function vFocus(){
  const{b,t,sid,title}=focusCtx(),T=TD();
  const todayLog=S.log.filter(l=>l.date===T);
  const todays=blocksOn(T).filter(x=>!x.done);
  const ctrls=!F.started?`<button class="btn" data-act="t-start">${ic('play')}Start</button>`:
    (F.running?`<button class="btn" data-act="t-pause">Pause</button>`:`<button class="btn" data-act="t-resume">${ic('play')}Resume</button>`)+`<button class="btn sec2" data-act="t-end">End session</button>`;
  const selVal=F.blockKey?'b|'+F.blockKey:F.taskId?'t|'+F.taskId:F.subject?'s|'+F.subject:'';
  return `<div class="phead"><div><h1>Focus</h1><div class="sub">Choose a planned session or any homework and work without distractions. Space starts and pauses.</div></div>
    <dl class="overview num"><div><dt>Focused today</dt><dd>${fmtMin(minsOn(T))}</dd></div><div><dt>This week</dt><dd>${fmtH(weekMins(0))}</dd></div></dl></div>
  <div class="focus"><div>
    <div class="fsel">
      <label class="field"><span>Working on</span><select class="in" id="fTask" ${F.started?'disabled':''}>
        <option value="" ${!selVal?'selected':''}>General study</option>
        ${todays.length?`<optgroup label="Today's plan">${todays.map(x=>`<option value="b|${esc(x.key)}" ${selVal==='b|'+x.key?'selected':''}>${x.start} · ${esc(x.title)}</option>`).join('')}</optgroup>`:''}
        <optgroup label="Homework">${openTasks().sort(byNext).map(o=>`<option value="t|${o.id}" ${selVal==='t|'+o.id?'selected':''}>${esc(o.title)}</option>`).join('')}</optgroup>
        <optgroup label="Subject">${S.subjects.map(s=>`<option value="s|${s.id}" ${selVal==='s|'+s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</optgroup></select></label>
      <div class="field"><span>Minutes</span><div class="seg" role="group">${[15,25,45,60].map(m=>`<button type="button" data-act="len" data-m="${m}" class="${F.len===m?'on':''}" ${F.started?'disabled':''}>${m}</button>`).join('')}</div></div>
    </div>
    <div class="stage" id="stage">
      <div class="label">${esc(sid?sub(sid).name:b&&b.kind==='read'?'Reading':'Study')}</div>
      <h2>${esc(title)}</h2>
      <div class="ctx">${b?`${PLANL[b.kind]} · planned ${b.start}–${b.end}`:t?`${cap(relShort(t.due))} · needs ${fmtMin(t.est)}`:'Not linked to a task'}</div>
      <div class="clock" id="clock">${clockTxt(F.remaining)}</div>
      <div class="bar"><span id="fbar" style="width:${(1-F.remaining/(F.len*60000))*100}%"></span></div>
      <div class="barlbl num"><span id="fel">${fmtMin(Math.floor((F.len*60000-F.remaining)/60000))} elapsed</span><span>${F.len} min session</span></div>
      <div class="ctrl">${ctrls}<button class="btn sec2 enterfs" data-act="fs">${ic('full')}Full screen</button><button class="btn sec2 exitfs" data-act="fs-exit">Exit full screen</button></div>
      ${F.msg?`<div class="msg"><span>${esc(F.msg)}</span>${F.doneTask?`<button class="btn sec2 sm" data-act="mark-done" data-id="${F.doneTask}">Homework finished</button>`:''}</div>`:''}
    </div>
  </div>
  <div class="col2">
    <section class="sec"><div class="sh"><h2>Logged today</h2><span class="aside num">${fmtMin(minsOn(T))}</span></div>
      ${todayLog.length?todayLog.map(l=>`<div class="lrow" style="grid-template-columns:minmax(0,1fr) auto"><span class="tt">${l.subject?subjMark(l.subject):'General'}${l.note?`<small>${esc(l.note)}</small>`:''}</span><span class="num muted">${fmtMin(l.min)}</span></div>`).join(''):'<div class="empty">No sessions logged today.</div>'}
    </section>
    <section class="sec"><div class="sh"><h2>This week by day</h2></div>${weekChart()}</section>
  </div></div>`;
}
let tickT=null,wake=null;
function tick(){
  if(F.running){F.remaining=F.endAt-Date.now();if(F.remaining<=0){F.remaining=0;finish(true);return}}
  const c=$('#clock');if(c){c.textContent=clockTxt(F.remaining);$('#fbar').style.width=((1-F.remaining/(F.len*60000))*100)+'%';$('#fel').textContent=fmtMin(Math.floor((F.len*60000-F.remaining)/60000))+' elapsed'}
}
async function lockWake(){try{wake=await navigator.wakeLock?.request('screen')}catch(e){wake=null}}
function tStart(){if(F.remaining<=0)F.remaining=F.len*60000;F.started=true;F.running=true;F.seg=Date.now();F.endAt=Date.now()+F.remaining;F.msg=null;F.doneTask=null;clearInterval(tickT);tickT=setInterval(tick,250);lockWake();render()}
function tPause(){if(!F.running)return;F.remaining=F.endAt-Date.now();F.accrued+=Date.now()-F.seg;F.running=false;clearInterval(tickT);try{wake?.release()}catch(e){}render()}
function finish(completed){
  if(F.running){F.accrued+=Date.now()-F.seg;F.running=false}
  clearInterval(tickT);try{wake?.release()}catch(e){}
  const min=Math.round(F.accrued/60000),{b,t,sid,title}=focusCtx();
  if(min>=1){
    if(b&&!b.done)markBlock(b.key,true,min);
    else{S.log.push({id:uid(),date:TD(),subject:sid||null,min,note:title});touch()}
  }
  F.msg=min>=1?`${completed?'Session complete.':'Session ended.'} ${fmtMin(min)} logged${b?' and the planned session marked done':''}.`:'Session ended. Under a minute, so nothing was logged.';
  F.doneTask=t&&min>=1?t.id:null;
  F.started=false;F.accrued=0;F.blockKey=null;F.remaining=F.len*60000;
  if(completed)chime();
  render();
}
function chime(){try{const a=new (window.AudioContext||window.webkitAudioContext)();[0,.22].forEach((d,i)=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=i?880:660;g.gain.setValueAtTime(.0001,a.currentTime+d);g.gain.exponentialRampToValueAtTime(.15,a.currentTime+d+.02);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d+.5);o.connect(g).connect(a.destination);o.start(a.currentTime+d);o.stop(a.currentTime+d+.55)})}catch(e){}}
let fsOn=false;
function setFs(on){fsOn=on;const st=$('#stage');if(st)st.classList.toggle('fs',on);
  try{if(on&&document.documentElement.requestFullscreen&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});if(!on&&document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch(e){}}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&fsOn)setFs(false)});
function focusOnBlock(key){
  if(F.started){go('focus');return}
  const b=plan().blocks.find(x=>x.key===key);if(!b)return;
  F.blockKey=key;F.taskId=null;F.subject=b.subject;F.len=b.min;F.remaining=b.min*60000;F.msg=null;go('focus');
}

/* =========================================================
   Progress
   ========================================================= */
function vProgress(){
  const goal=+S.settings.goal||14,weeks=[...Array(8)].map((_,i)=>{const off=i-7;return{off,m:weekMins(off),ws:weekStart(addDays(today(),off*7))}});
  const maxH=Math.max(goal,...weeks.map(w=>w.m/60)),top=Math.ceil(maxH/5)*5||5,W=600,H=210,L=30,B=H-24,cw=(W-L)/8,bw=cw*.52;
  const y=h=>B-(h/top)*(B-10);
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Study hours, last 8 weeks">`;
  for(let v=0;v<=top;v+=5)s+=`<line class="grid" x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L-8}" y="${y(v)+3}" text-anchor="end">${v}</text>`;
  weeks.forEach((w,i)=>{const h=w.m/60,x=L+i*cw+(cw-bw)/2;s+=`<rect class="b ${w.off===0?'cur':''}" x="${x}" y="${y(h)}" width="${bw}" height="${Math.max(0,B-y(h))}"/>${h?`<text class="vl" x="${x+bw/2}" y="${y(h)-5}" text-anchor="middle">${h.toFixed(1)}</text>`:''}<text class="ax" x="${x+bw/2}" y="${H-6}" text-anchor="middle">${w.off===0?'This week':w.ws.getDate()+' '+MON[w.ws.getMonth()]}</text>`});
  s+=`<line class="goal" x1="${L}" x2="${W}" y1="${y(goal)}" y2="${y(goal)}"/><text class="goalt" x="${W}" y="${y(goal)-5}" text-anchor="end">Goal ${goal} h</text></svg>`;
  const ws=iso(weekStart(today())),we=iso(addDays(weekStart(today()),6));
  const bySub=S.subjects.map(sb=>({sb,m:S.log.filter(l=>l.subject===sb.id&&l.date>=ws&&l.date<=we).reduce((a,l)=>a+l.min,0)})).sort((a,b)=>b.m-a.m);
  const maxS=Math.max(60,...bySub.map(x=>x.m));
  const avg4=weeks.slice(3,7).reduce((a,w)=>a+w.m,0)/4;
  const T=TD(),past7=iso(addDays(today(),-6));
  const readDays=new Set(S.doneBlocks.filter(b=>b.kind==='read'&&b.day>=past7&&b.day<=T).map(b=>b.day)).size;
  const paperDays=new Set(S.doneBlocks.filter(b=>b.kind==='paper'&&b.day>=past7&&b.day<=T).map(b=>b.day)).size;
  const rs=revStats();
  return `<div class="phead"><div><h1>Progress</h1><div class="sub">Study time, subject balance, daily habits and revision coverage.</div></div>
    <dl class="overview num"><div><dt>4-week average</dt><dd>${fmtH(avg4)}</dd></div><div><dt>This week</dt><dd>${fmtH(weeks[7].m)}</dd></div>
    <div><dt>Reading, last 7 days</dt><dd>${readDays} / 7</dd></div><div><dt>Past papers, last 7 days</dt><dd>${paperDays} / 7</dd></div></dl></div>
  <div class="grid2">
    <div><section class="sec"><div class="sh"><h2>Study hours, last 8 weeks</h2><span class="aside">Hours per week</span></div>${s}</section>
      <section class="sec"><div class="sh"><h2>Revision checklist</h2><span class="aside num">${rs.done} of ${rs.total} topics</span></div>
      ${S.subjects.map(sb=>{const r=S.revision.filter(x=>x.subject===sb.id);if(!r.length)return '';const st=revStats(sb.id);
        return `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">${subjMark(sb.id)}<span class="num muted" style="font-size:12px">${st.done}/${st.total}</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 18px">${r.map(x=>`<label style="display:inline-flex;gap:7px;align-items:center;font-size:13px;cursor:pointer;${x.done?'color:var(--slate)':''}"><input type="checkbox" class="ck" data-rev="${x.id}" ${x.done?'checked':''}>${esc(x.topic)}<button type="button" class="icon" style="width:20px;height:20px" data-act="del-rev" data-id="${x.id}" aria-label="Remove topic">${ic('del')}</button></label>`).join('')}</div></div>`}).join('')||'<div class="empty">List the topics you need to revise and tick them off as you go.</div>'}
      <form id="revForm" class="toolbar" autocomplete="off" style="padding-top:14px"><label class="field"><span>Subject</span><select class="in" id="rf-sub">${S.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
        <label class="field q"><span>New topic</span><input class="in" id="rf-topic" required placeholder="e.g. Electromagnetic induction"></label><button class="btn sec2" type="submit">Add topic</button></form></section></div>
    <div class="col2"><section class="sec"><div class="sh"><h2>This week by subject</h2><span class="aside num">${fmtH(weeks[7].m)}</span></div>
      ${bySub.map(x=>`<div class="rv" style="grid-template-columns:minmax(0,120px) minmax(0,1fr) 50px"><span>${esc(x.sb.name)}</span><div class="bar"><span style="width:${x.m/maxS*100}%;background:${esc(x.sb.color)}"></span></div><span class="num">${x.m?fmtH(x.m):'–'}</span></div>`).join('')}
    </section>
    <section class="sec"><div class="sh"><h2>Test readiness</h2></div>
      ${S.tests.filter(t=>t.date>=T).sort((a,b)=>a.date<b.date?-1:1).map(t=>`<div class="rv" style="grid-template-columns:minmax(0,1fr) 90px 40px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.title)}</span><div class="bar gold"><span style="width:${t.prep}%"></span></div><span class="num">${t.prep}%</span></div>`).join('')||'<div class="empty">No upcoming tests.</div>'}
    </section></div>
  </div>`;
}

/* =========================================================
   Settings & Integrations
   ========================================================= */
function vSettings(){
  const c=ui.confirm,st=S.settings;
  const num=(id,label,val,min,max,step=5,w=150)=>`<label class="field" style="width:${w}px"><span>${label}</span><input class="in num" type="number" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
  return `<div class="phead"><div><h1>Settings</h1><div class="sub">Your details, the planning rules and your subjects.</div></div></div>
  <div class="set"><div><h2>Profile</h2><p>Used for the greeting and your weekly goal.</p></div>
    <form class="body" id="profForm"><div class="row">
      <label class="field" style="flex:1 1 200px"><span>Name</span><input class="in" id="sf-name" value="${esc(st.name)}" placeholder="Your first name"></label>
      ${num('sf-goal','Weekly goal (hours)',st.goal,1,80,1)}${num('sf-len','Default focus (min)',st.focusLen,5,180)}
      <button class="btn" type="submit">Save</button></div>${ui.flash==='prof'?'<span class="ok">Saved.</span>':''}</form></div>
  <div class="set"><div><h2>Planning rules</h2><p>How the automatic plan is built. Set reading or past papers to 0 to turn them off.</p></div>
    <form class="body" id="ruleForm"><div class="row">
      ${num('rf-read','Reading per day (min)',st.readMin,0,120)}${num('rf-paper','Past papers per day (min)',st.paperMin,0,120)}${num('rf-prep','Test prep per day (min)',st.prepMin,10,180)}
    </div><div class="row">
      ${num('rf-days','Prep starts (days before test)',st.prepDays,1,21,1,190)}${num('rf-block','Longest homework block (min)',st.maxBlock,15,180,5,190)}${num('rf-hor','Plan ahead (days)',st.horizon,7,42,1)}
      <button class="btn" type="submit">Save rules</button></div>
      <span class="muted" style="font-size:12.5px">Prep sessions in the last two days before a test are 15 minutes longer. Past papers follow the subject of your next test.</span>
      ${ui.flash==='rules'?'<span class="ok">Saved. The plan has been rebuilt.</span>':''}</form></div>
  <div class="set"><div><h2>Subjects</h2><p>Each subject keeps one colour across the calendar, lists and charts. Muted tones read best.</p></div>
    <div class="body">${S.subjects.map(s=>{const used=S.tasks.some(t=>t.subject===s.id)||S.tests.some(t=>t.subject===s.id)||S.classes.some(t=>t.subject===s.id);return `<div class="row" style="align-items:center">
      <input type="color" class="sw" value="${esc(s.color)}" data-color="${s.id}" aria-label="Colour for ${esc(s.name)}">
      <input class="in" style="flex:1 1 200px;width:auto" value="${esc(s.name)}" data-sname="${s.id}" aria-label="Subject name">
      <button class="icon" data-act="del-sub" data-id="${s.id}" ${used?'disabled title="Used by classes, homework or tests"':''} aria-label="Remove subject" style="${used?'opacity:.3;cursor:not-allowed':''}">${ic('del')}</button></div>`}).join('')}
      <form class="row" id="subForm" autocomplete="off"><input type="color" class="sw" id="nf-color" value="${PALETTE[S.subjects.length%PALETTE.length]}" aria-label="Colour"><input class="in" style="flex:1 1 200px;width:auto" id="nf-name" required placeholder="Add a subject"><button class="btn sec2" type="submit">Add</button></form></div></div>
  <div class="set"><div><h2>Data</h2><p>${CLOUD?'Your planner is saved to your account and syncs across devices.':'Everything is stored in this browser on this device.'}</p></div>
    <div class="body"><div class="row">
      ${c==='clear'?'<button class="btn danger" data-act="do-clear">Confirm: delete everything</button><button class="btn sec2" data-act="confirm" data-c="">Cancel</button>':'<button class="btn sec2" data-act="confirm" data-c="clear">Start empty</button>'}
      ${c==='example'?'<button class="btn danger" data-act="do-example">Confirm: replace with example</button><button class="btn sec2" data-act="confirm" data-c="">Cancel</button>':'<button class="btn sec2" data-act="confirm" data-c="example">Load example week</button>'}
    </div><span class="muted" style="font-size:12.5px">Start empty keeps your subjects and settings and removes classes, homework, tests, events and history.</span></div></div>
  ${CLOUD?`<div class="set"><div><h2>Account</h2><p>Signed in as ${esc(user?.email)}.</p></div><div class="body"><div class="row"><button class="btn sec2" data-act="signout">Sign out</button></div></div></div>`:''}`;
}
function vIntegrations(){
  return `<div class="phead"><div><h1>Integrations</h1><div class="sub">Bring in events from another calendar, and back up or move your planner.</div></div></div>
  <div class="set"><div><h2>Calendar file</h2><p>Import an .ics file from Google Calendar, Outlook, Apple Calendar or your school portal. Events are worked around when planning.</p></div>
    <div class="body"><div class="row"><label class="field"><span>Import as</span><select class="in" id="ics-kind" style="width:160px"><option value="school">School</option><option value="personal">Personal</option></select></label>
      <label class="field" style="flex:1 1 240px"><span>Calendar file (.ics)</span><input class="in" type="file" id="ics-file" accept=".ics,text/calendar" style="padding-top:5px"></label></div>
      <span id="ics-msg" class="ok"></span></div></div>
  <div class="set"><div><h2>Timetable spreadsheet</h2><p>Classes come in from a CSV file on the Timetable page.</p></div>
    <div class="body"><div class="row"><a class="btn sec2" href="#timetable">Go to Timetable</a><a class="btn ghost" href="timetable-template.csv" download>Download template</a></div></div></div>
  <div class="set"><div><h2>Back up</h2><p>Save a copy of your whole planner as a file.</p></div>
    <div class="body"><div class="row"><button class="btn sec2" data-act="dl-bk">Download backup</button><button class="btn ghost" data-act="copy-bk">Copy as text</button><span id="bk-msg" class="ok"></span></div></div></div>
  <div class="set"><div><h2>Restore</h2><p>Replaces everything in this planner with a backup.</p></div>
    <div class="body"><div class="row"><label class="field" style="flex:1 1 240px"><span>Backup file (.json)</span><input class="in" type="file" id="bk-file" accept=".json,application/json" style="padding-top:5px"></label></div><span id="rs-msg" class="ok"></span></div></div>`;
}
function parseICS(txt){
  const lines=txt.replace(/\r?\n[ \t]/g,'').split(/\r?\n/),out=[];let cur=null;
  const dt=v=>{const m=v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);if(!m)return null;
    if(m[4]){const d=m[7]?new Date(Date.UTC(+m[1],m[2]-1,+m[3],+m[4],+m[5])):new Date(+m[1],m[2]-1,+m[3],+m[4],+m[5]);return{day:iso(d),time:`${pad(d.getHours())}:${pad(d.getMinutes())}`}}
    return{day:iso(new Date(+m[1],m[2]-1,+m[3])),time:null}};
  for(const l of lines){
    if(l==='BEGIN:VEVENT')cur={};
    else if(l==='END:VEVENT'){if(cur&&cur.s)out.push(cur);cur=null}
    else if(cur){const i=l.indexOf(':');if(i<0)continue;const k=l.slice(0,i).split(';')[0],v=l.slice(i+1);
      if(k==='SUMMARY')cur.title=v.replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\n/gi,' ');
      if(k==='DTSTART')cur.s=dt(v);if(k==='DTEND')cur.e=dt(v)}
  }
  return out;
}
function downloadText(name,txt,type){const b=new Blob([txt],{type});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* =========================================================
   Render
   ========================================================= */
const ui={taskF:{subject:'all',status:'open',q:''},sort:{key:'due',dir:1},editTask:null,week:0,selEvent:null,confirm:null,flash:null,pick:{cls:[1],free:[1,2,3,4,5],commit:[2]}};
const VFN={dashboard:vDashboard,timetable:vTimetable,tasks:vTasks,tests:vTests,calendar:vCalendar,focus:vFocus,progress:vProgress,settings:vSettings,integrations:vIntegrations};
let lastView=null;
function render(){
  if(!S)return;
  const v=currentView();renderNav(v);
  const sc=v===lastView?window.scrollY:0;const cw=$('#calwrap');const cs=cw?cw.scrollLeft:0;
  $('#view').innerHTML=VFN[v]();
  window.scrollTo(0,v===lastView?sc:0);
  const nw=$('#calwrap');if(nw)nw.scrollLeft=v===lastView?cs:0;
  if(v==='focus'&&fsOn)$('#stage')?.classList.add('fs');
  if(v!=='focus'&&fsOn)setFs(false);
  lastView=v;ui.flash=null;
}
function go(v){if(location.hash==='#'+v)render();else location.hash=v}
function startApp(){
  document.body.classList.add('authed');$('#auth').innerHTML='';
  F.len=+S.settings.focusLen||45;F.remaining=F.len*60000;
  planVersion++;lastView=null;render();
}
window.addEventListener('hashchange',()=>{if(!S||/access_token|type=/.test(location.hash))return;ui.selEvent=null;ui.confirm=null;ui.editTask=null;closeMenu();render()});
function closeMenu(){$('#side').classList.remove('open');$('.scrim').classList.remove('open')}

/* =========================================================
   Events
   ========================================================= */
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');if(!a||!S)return;const act=a.dataset.act,id=a.dataset.id;
  switch(act){
    case 'menu':$('#side').classList.add('open');$('.scrim').classList.add('open');break;
    case 'menu-close':closeMenu();break;
    case 'signout':signOut();break;
    case 'pri':{const t=S.tasks.find(x=>x.id===id);t.priority={high:'med',med:'low',low:'high'}[t.priority];touch();render();break}
    case 'edit-task':ui.editTask=id;render();$('#tf-title')?.focus();window.scrollTo(0,0);break;
    case 'cancel-edit':ui.editTask=null;render();break;
    case 'del-task':S.tasks=S.tasks.filter(x=>x.id!==id);S.doneBlocks=S.doneBlocks.filter(b=>!(b.kind==='hw'&&b.ref===id&&b.day>=TD()));if(ui.editTask===id)ui.editTask=null;touch();render();break;
    case 'sort':{const k=a.dataset.key;ui.sort=ui.sort.key===k?{key:k,dir:-ui.sort.dir}:{key:k,dir:1};render();break}
    case 'status':ui.taskF.status=a.dataset.s;render();break;
    case 'del-test':S.tests=S.tests.filter(x=>x.id!==id);touch();render();break;
    case 'wk':{const d=+a.dataset.d;ui.week=d===0?0:ui.week+d;ui.selEvent=null;render();break}
    case 'sel-ev':ui.selEvent=a.dataset.key||null;render();break;
    case 'del-ev':S.events=S.events.filter(x=>x.id!==id);ui.selEvent=null;touch();render();break;
    case 'del-class':S.classes=S.classes.filter(x=>x.id!==id);touch();render();break;
    case 'do-clear-classes':S.classes=[];ui.confirm=null;touch();render();break;
    case 'del-free':S.free=S.free.filter(x=>x.id!==id);S.freeDefault=false;touch();render();break;
    case 'pick':{const g=a.dataset.g,d=+a.dataset.d,arr=ui.pick[g];const i=arr.indexOf(d);if(i>=0)arr.splice(i,1);else arr.push(d);a.classList.toggle('on');a.setAttribute('aria-pressed',a.classList.contains('on'));break}
    case 'paste-classes':{const r=importClasses($('#clsPaste').value);finishImport(r);break}
    case 'block-done':markBlock(a.dataset.key,true);ui.selEvent=null;render();break;
    case 'block-undo':markBlock(a.dataset.key,false);ui.selEvent=null;render();break;
    case 'focus-block':focusOnBlock(a.dataset.key);break;
    case 'len':F.len=+a.dataset.m;F.remaining=F.len*60000;render();break;
    case 't-start':case 't-resume':tStart();break;
    case 't-pause':tPause();break;
    case 't-end':finish(false);break;
    case 'fs':setFs(true);break;
    case 'fs-exit':setFs(false);break;
    case 'mark-done':{const t=S.tasks.find(x=>x.id===id);if(t){t.done=true;touch()}F.doneTask=null;F.msg='Homework marked as finished.';render();break}
    case 'del-rev':e.preventDefault();S.revision=S.revision.filter(x=>x.id!==id);touch();render();break;
    case 'confirm':ui.confirm=a.dataset.c||null;render();break;
    case 'do-clear':S={...S,sample:false,classes:[],tasks:[],tests:[],events:[],doneBlocks:[],log:[],revision:[]};ui.confirm=null;touch();render();break;
    case 'do-example':S=exampleState(S.settings.name);ui.confirm=null;touch();render();break;
    case 'del-sub':if(a.hasAttribute('disabled'))break;S.subjects=S.subjects.filter(s=>s.id!==id);S.revision=S.revision.filter(x=>x.subject!==id);touch();render();break;
    case 'dl-bk':downloadText(`quire-backup-${TD()}.json`,JSON.stringify(S,null,1),'application/json');$('#bk-msg').textContent='Backup downloaded.';break;
    case 'copy-bk':{const msg=$('#bk-msg');navigator.clipboard?.writeText(JSON.stringify(S)).then(()=>msg.textContent='Copied.',()=>msg.textContent='Copying is blocked here. Use Download backup.');break}
  }
});
function finishImport(r){
  touch();
  ui.flash='cls:'+(r.added?`Added ${r.added} ${r.added===1?'class':'classes'}${r.skipped?`. Skipped ${r.skipped} ${r.skipped===1?'row':'rows'} that had a missing day, time or subject.`:'.'}`:'No classes found. Check the columns are Day, Start, End, Subject, Room.');
  render();
}
document.addEventListener('change',e=>{
  const el=e.target;if(!S)return;
  if(el.dataset.toggle){const t=S.tasks.find(x=>x.id===el.dataset.toggle);if(t){t.done=el.checked;touch();render()}return}
  if(el.dataset.block){markBlock(el.dataset.block,el.checked);render();return}
  if(el.dataset.rev){const r=S.revision.find(x=>x.id===el.dataset.rev);if(r){r.done=el.checked;touch();render()}return}
  if(el.dataset.prep){const t=S.tests.find(x=>x.id===el.dataset.prep);if(t){t.prep=+el.value;touch()}return}
  if(el.dataset.color){const s=sub(el.dataset.color);s.color=el.value;touch();return}
  if(el.dataset.sname){const s=S.subjects.find(x=>x.id===el.dataset.sname);if(s&&el.value.trim()){s.name=el.value.trim();touch()}return}
  if(el.id==='tsub'){ui.taskF.subject=el.value;$('#tbody').innerHTML=tasksBody();return}
  if(el.id==='fTask'){const[k,v]=el.value.split('|');F.blockKey=null;F.taskId=null;F.subject=null;
    if(k==='b'){const b=plan().blocks.find(x=>x.key===v);if(b){F.blockKey=v;F.subject=b.subject;F.len=b.min;F.remaining=b.min*60000}}
    else if(k==='t')F.taskId=v;else if(k==='s')F.subject=v;F.msg=null;render();return}
  if(el.id==='clsFile'){readFile(el.files&&el.files[0],txt=>finishImport(importClasses(txt)));return}
  if(el.id==='ics-file'){const msg=$('#ics-msg'),kind=$('#ics-kind').value;readFile(el.files&&el.files[0],txt=>{
    const evs=parseICS(txt);let n=0;
    for(const x of evs){const title=x.title||'Untitled';if(x.s.time){const st=x.s.time,en=x.e&&x.e.time&&x.e.day===x.s.day?x.e.time:fromMin(Math.min(toMin(st)+60,23*60+59));S.events.push({id:uid(),title,kind,day:x.s.day,start:st,end:en})}else S.events.push({id:uid(),title,kind,day:x.s.day,allDay:true,start:'00:00',end:'23:59'});n++}
    touch();msg.style.color=n?'':'var(--red)';msg.textContent=n?`Imported ${n} ${n===1?'event':'events'}. They now appear in the calendar.`:'No events found in that file.'});return}
  if(el.id==='bk-file'){const msg=$('#rs-msg');readFile(el.files&&el.files[0],txt=>{try{const o=normalize(JSON.parse(txt));if(!o||!Array.isArray(o.tasks))throw 0;S=o;touch();render();$('#rs-msg').textContent='Planner restored.'}catch(err){msg.style.color='var(--red)';msg.textContent='That file is not a Quire backup.'}});return}
});
function readFile(f,cb){if(!f)return;const r=new FileReader();r.onload=()=>cb(String(r.result));r.readAsText(f)}
document.addEventListener('input',e=>{
  const el=e.target;if(!S)return;
  if(el.id==='tq'){ui.taskF.q=el.value;$('#tbody').innerHTML=tasksBody();return}
  if(el.dataset.prep){const p=$('#pp-'+el.dataset.prep);if(p)p.textContent=el.value+'%'}
});
['dragover','dragenter'].forEach(t=>document.addEventListener(t,e=>{const d=e.target.closest&&e.target.closest('#drop');if(d){e.preventDefault();d.classList.add('over')}}));
document.addEventListener('dragleave',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d)d.classList.remove('over')});
document.addEventListener('drop',e=>{const d=e.target.closest&&e.target.closest('#drop');if(!d)return;e.preventDefault();d.classList.remove('over');readFile(e.dataTransfer.files[0],txt=>finishImport(importClasses(txt)))});

function timesOk(sId,eId,form){const s=$(sId).value,en=$(eId).value;if(!s||!en||toMin(en)<=toMin(s)){$(eId).setCustomValidity('End must be after start');form.reportValidity();$(eId).setCustomValidity('');return false}return true}
document.addEventListener('submit',e=>{
  const f=e.target;if(f.id==='authForm'||!S)return;e.preventDefault();
  if(f.id==='taskForm'){const v={title:$('#tf-title').value.trim(),subject:$('#tf-sub').value,due:$('#tf-due').value,est:Math.max(5,Math.round(+$('#tf-est').value||30)),priority:$('#tf-pri').value,type:$('#tf-type').value};
    if(!v.title||!v.due){f.reportValidity();return}
    if(ui.editTask){Object.assign(S.tasks.find(t=>t.id===ui.editTask),v);ui.editTask=null}else S.tasks.push({id:uid(),done:false,...v});
    touch();render();$('#tf-title')?.focus()}
  if(f.id==='testForm'){const v={id:uid(),title:$('#xf-title').value.trim(),subject:$('#xf-sub').value,date:$('#xf-date').value,time:$('#xf-time').value||'09:00',dur:Math.max(10,+$('#xf-dur').value||60),prep:Math.min(100,Math.max(0,+$('#xf-prep').value||0))};if(!v.title||!v.date){f.reportValidity();return}S.tests.push(v);touch();render()}
  if(f.id==='evForm'){if(!timesOk('#ef-s','#ef-e',f))return;const day=$('#ef-day').value;
    S.events.push({id:uid(),title:$('#ef-title').value.trim(),kind:$('#ef-kind').value,day,start:$('#ef-s').value,end:$('#ef-e').value});
    ui.week=Math.round((weekStart(parse(day))-weekStart(today()))/(7*864e5));touch();render()}
  if(f.id==='clsForm'){if(!ui.pick.cls.length){$('#clsMsg').style.color='var(--red)';$('#clsMsg').textContent='Choose at least one day.';return}if(!timesOk('#cf-s','#cf-e',f))return;
    const s=$('#cf-s').value,en=$('#cf-e').value;S.classes.push({id:uid(),subject:$('#cf-sub').value,dow:[...ui.pick.cls],start:s,end:en,room:$('#cf-room').value.trim()});
    touch();render();const ns=$('#cf-s'),ne=$('#cf-e');if(ns){ns.value=en;ne.value=fromMin(toMin(en)+(toMin(en)-toMin(s)))}}
  if(f.id==='freeForm'){if(!ui.pick.free.length)return;if(!timesOk('#ff-s','#ff-e',f))return;
    if(S.freeDefault){S.free=[];S.freeDefault=false}
    for(const d of ui.pick.free)S.free.push({id:uid(),dow:d,start:$('#ff-s').value,end:$('#ff-e').value});
    for(const d of WEEK){const w=S.free.filter(x=>x.dow===d);const m=mergeIv(w.map(x=>[toMin(x.start),toMin(x.end)]));if(m.length<w.length){S.free=S.free.filter(x=>x.dow!==d).concat(m.map(([a,b])=>({id:uid(),dow:d,start:fromMin(a),end:fromMin(b)})))}}
    touch();render()}
  if(f.id==='commitForm'){if(!ui.pick.commit.length)return;if(!timesOk('#kf-s','#kf-e',f))return;
    S.events.push({id:uid(),title:$('#kf-title').value.trim(),kind:'personal',dow:[...ui.pick.commit],start:$('#kf-s').value,end:$('#kf-e').value});touch();render()}
  if(f.id==='profForm'){S.settings.name=$('#sf-name').value.trim();S.settings.goal=Math.max(1,+$('#sf-goal').value||14);S.settings.focusLen=Math.max(5,+$('#sf-len').value||45);
    if(!F.started){F.len=S.settings.focusLen;F.remaining=F.len*60000}touch();ui.flash='prof';render()}
  if(f.id==='ruleForm'){const st=S.settings,n=(id,lo,hi,d)=>Math.min(hi,Math.max(lo,Math.round(+$(id).value)))||d;
    st.readMin=Math.min(120,Math.max(0,Math.round(+$('#rf-read').value||0)));st.paperMin=Math.min(120,Math.max(0,Math.round(+$('#rf-paper').value||0)));
    st.prepMin=n('#rf-prep',10,180,30);st.prepDays=n('#rf-days',1,21,7);st.maxBlock=n('#rf-block',15,180,45);st.horizon=n('#rf-hor',7,42,21);
    touch();ui.flash='rules';render()}
  if(f.id==='subForm'){const n=$('#nf-name').value.trim();if(!n)return;S.subjects.push({id:uid(),name:n,color:$('#nf-color').value});touch();render()}
  if(f.id==='revForm'){const t=$('#rf-topic').value.trim();if(!t)return;S.revision.push({id:uid(),subject:$('#rf-sub').value,topic:t,done:false});touch();render()}
});
document.addEventListener('keydown',e=>{
  if(!S||currentView()!=='focus')return;
  const tag=(e.target.tagName||'').toLowerCase();if(['input','select','textarea','button'].includes(tag))return;
  if(e.code==='Space'){e.preventDefault();if(!F.started||!F.running)tStart();else tPause()}
  if(e.key==='Escape'&&fsOn)setFs(false);
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&F.running){tick();lockWake()}});
setInterval(()=>{if(S&&!F.running&&['dashboard','calendar'].includes(currentView())&&!document.activeElement?.matches('input,select,textarea'))render()},60000);

boot();
})();
