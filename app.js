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
const KINDS={class:'Class',school:'School',test:'Test',personal:'Event',study:'Study',holiday:'Holiday',away:'Away'};
const PLANL={read:'Reading',paper:'Past paper',prep:'Test prep',hw:'Homework',study:'Revision'};
const PALETTE=['#244B75','#3E6E72','#8A6A3A','#577A4F','#7B4F6B','#8C5545','#4F5D7C','#6B6A3E','#5E4E7A','#3F6B8C'];

/* =========================================================
   Data
   ========================================================= */
const DEFAULT_SETTINGS={name:'',goal:14,focusLen:45,readMin:15,paperMin:15,prepMin:30,prepDays:7,maxBlock:45,horizon:28,studyDay:90,studyWeekend:180,dayStart:'09:30',dayEnd:'21:30',travel:30,lunch:'13:00',dinner:'20:00',dinnerMin:30,hoursSet:false};
const DEFAULT_SUBJECTS=[['Mathematics'],['Physics'],['Chemistry'],['Biology'],['English'],['History'],['Computer Science']].map(([n],i)=>({id:uid(),name:n,color:PALETTE[i]}));
function emptyState(name){
  return {v:2,sample:false,settings:{...DEFAULT_SETTINGS,name:name||''},subjects:DEFAULT_SUBJECTS.map(s=>({...s,id:uid()})),
    classes:[],holidays:[],tasks:[],tests:[],events:[],doneBlocks:[],log:[],revision:[]};
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
  const holidays=[{id:uid(),name:'Mid-term break',start:D(12),end:D(15)}];
  return {v:2,sample:true,settings:{...DEFAULT_SETTINGS,name:name||'',hoursSet:true},subjects,classes,holidays,tasks,tests,events,doneBlocks:[],log,revision};
}
function normalize(o){
  if(!o||typeof o!=='object')return null;
  const base=emptyState('');
  const s={...base,...o,settings:{...DEFAULT_SETTINGS,...(o.settings||{})}};
  for(const k of ['subjects','classes','holidays','tasks','tests','events','doneBlocks','log','revision'])if(!Array.isArray(s[k]))s[k]=[];
  s.events=s.events.filter(e=>e.kind!=='study'); // v1 hand-made study sessions are now planned automatically
  s.log.forEach(l=>{if(!l.id)l.id=uid()});
  delete s.free;delete s.freeDefault;
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
   Subject types and test lead time
   ========================================================= */
const STYPES={science:['Science or maths',14],humanities:['Humanities',7],language:['Language',5],other:['Other',7]};
function classify(name){
  const n=String(name||'').toLowerCase();
  if(/math|physic|chem|bio|science|computer|comp sci|\bcs\b|\bict\b|econom|account|statistic|electronic|engineer/.test(n))return 'science';
  if(/english|hindi|french|spanish|german|sanskrit|marathi|gujarati|tamil|telugu|kannada|bengali|urdu|punjabi|japanese|mandarin|chinese|latin|arabic|language|literature|\blit\b/.test(n))return 'language';
  if(/history|geograph|civic|politic|social|\bsst\b|psychol|sociol|business|religio|philosoph|\bevs\b|environment|law|legal/.test(n))return 'humanities';
  return 'other';
}
const subType=s=>s.type||classify(s.name);
const subLead=s=>Math.max(1,Math.min(28,+(s.prepDays??STYPES[subType(s)][1])||7));
const isBigTest=t=>(+t.dur||0)>=90||/exam|mid-?term|final|board|annual|term[- ]end|half[- ]yearly|pre-?board/i.test(t.title||'');
function prepDaysFor(t){const base=subLead(sub(t.subject));return Math.min(28,isBigTest(t)?Math.round(base*1.5):base)}

/* =========================================================
   School holidays
   ========================================================= */
const MONS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MRE='(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
function mkDate(y,m,d){if(m<0||m>11||d<1||d>31)return null;const t=today();let yy=y;
  if(yy==null){yy=t.getFullYear();if(new Date(yy,m,d)<addDays(t,-90))yy++}else if(yy<100)yy+=2000;
  const x=new Date(yy,m,d);return x.getMonth()===m?iso(x):null}
function datesIn(text){
  let s=' '+String(text||'').toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g,'$1')+' ';
  const found=[];const take=(re,fn)=>{s=s.replace(re,(...m)=>{const r=fn(m);if(r&&r.length){found.push({i:m[m.length-2],r});return ' '.repeat(m[0].length)}return m[0]})};
  const mi=x=>MONS.indexOf(x.slice(0,3));
  // 28 - 31 Oct 2026  /  Oct 28 - 31, 2026
  take(new RegExp(`\\b(\\d{1,2})\\s*(?:-|–|—|to)\\s*(\\d{1,2})\\s+${MRE},?\\s*(\\d{4})?`,'g'),m=>[mkDate(m[4]?+m[4]:null,mi(m[3]),+m[1]),mkDate(m[4]?+m[4]:null,mi(m[3]),+m[2])]);
  take(new RegExp(`\\b${MRE}\\s+(\\d{1,2})\\s*(?:-|–|—|to)\\s*(\\d{1,2}),?\\s*(\\d{4})?`,'g'),m=>[mkDate(m[4]?+m[4]:null,mi(m[1]),+m[2]),mkDate(m[4]?+m[4]:null,mi(m[1]),+m[3])]);
  take(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,m=>[mkDate(+m[1],+m[2]-1,+m[3])]);
  take(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})\b/g,m=>{let d=+m[1],mo=+m[2];if(mo>12&&d<=12)[d,mo]=[mo,d];return[mkDate(+m[3],mo-1,d)]});
  take(new RegExp(`\\b(\\d{1,2})[\\s\\-]+${MRE}[,\\s\\-]*(\\d{4})?`,'g'),m=>[mkDate(m[3]?+m[3]:null,mi(m[2]),+m[1])]);
  take(new RegExp(`\\b${MRE}\\s+(\\d{1,2})\\b,?\\s*(\\d{4})?`,'g'),m=>[mkDate(m[3]?+m[3]:null,mi(m[1]),+m[2])]);
  return found.sort((a,b)=>a.i-b.i).flatMap(f=>f.r).filter(Boolean);
}
const HDR=/^(s\.?\s?no\.?|sr\.?|no\.?|#|holidays?|name|occasion|events?|festival|reason|description|from|to|date|dates|start|end|day|days|duration|remarks?)$/i;
function holName(cells){
  for(const c of cells){
    let t=String(c||'');for(const re of [new RegExp(`\\b\\d{1,2}\\s*(?:-|–|—|to)\\s*\\d{1,2}\\s+${MRE},?\\s*(\\d{4})?`,'gi'),/\b\d{4}-\d{1,2}-\d{1,2}/g,/\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/g,new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?[\\s\\-]+${MRE}[,\\s\\-]*(\\d{4})?`,'gi'),new RegExp(`\\b${MRE}\\s+\\d{1,2}(st|nd|rd|th)?,?\\s*(\\d{4})?`,'gi')])t=t.replace(re,' ');
    t=t.replace(/\b(mon|tues?|wed(nes)?|thu(rs)?|fri|sat(ur)?|sun)(day)?\b/gi,' ').replace(/\b(to|till|until|from)\b/gi,' ').replace(/[–—\-:,()|\/]+/g,' ').replace(/\s+/g,' ').trim();
    if(t.length>=2&&/[a-z]/i.test(t)&&!HDR.test(t)&&!/^\d+$/.test(t))return t.length>60?t.slice(0,60):t;
  }
  return 'School holiday';
}
function analyseHolidays(rows){
  const out=[];
  for(const r of rows){
    const cells=(r||[]).map(c=>String(c||'').trim()).filter(Boolean);if(!cells.length)continue;
    const ds=datesIn(cells.join(' | '));if(!ds.length)continue;
    const start=ds[0];let end=ds[1]&&ds[1]>=start&&diffDays(start,ds[1])<=90?ds[1]:start;
    const name=holName(cells);
    if(!out.some(h=>h.start===start&&h.end===end))out.push({name,start,end});
  }
  return out.sort((a,b)=>a.start<b.start?-1:1);
}
async function runHolImport(kind,payload){
  const msg=t=>{ui.holMsg=t;ui.holBusy=false;render()};
  ui.holBusy=true;ui.holMsg='';render();
  try{
    let rows=[];
    if(kind==='link')rows=await fetchGoogleSheet(payload);
    else if(kind==='paste')rows=parseDelimited(payload);
    else{
      const f=payload;
      if(/\.ics$/i.test(f.name)){const evs=parseICS(await f.text());
        ui.holPreview={source:f.name,list:evs.filter(e=>e.s).map(e=>{let end=e.e?e.e.day:e.s.day;if(e.e&&!e.e.time&&end>e.s.day)end=iso(addDays(parse(end),-1));return{name:(e.title||'School holiday').slice(0,60),start:e.s.day,end:end<e.s.day?e.s.day:end}})};
        ui.holBusy=false;ui.holMsg=ui.holPreview.list.length?'':'No dates found in that calendar file.';if(!ui.holPreview.list.length)ui.holPreview=null;render();return}
      if(/\.(xlsx|xlsm|xls|ods)$/i.test(f.name))rows=(await sheetsFromWorkbook(await f.arrayBuffer())).flatMap(s=>s.rows);
      else rows=parseDelimited(await f.text());
    }
    const list=analyseHolidays(rows);
    if(!list.length)return msg('No dates were found. Each holiday needs a date such as 28/10/2026, 28 Oct or 28 Oct – 3 Nov.');
    ui.holPreview={source:kind==='file'?payload.name:kind==='link'?'Google Sheet':'Pasted text',list};ui.holBusy=false;ui.holMsg='';render();
    $('#holPreview')?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    if(err&&err.message==='link')return msg('That does not look like a Google Sheets link.');
    if(err&&err.message==='access')return msg('Could not open that sheet. Set sharing to “Anyone with the link”, or copy the cells and use Paste.');
    return msg('That file could not be read. Try .xlsx, .csv or .ics.');
  }
}
const holLabel=h=>{const n=diffDays(h.start,h.end)+1;return `${fmtDate(h.start)}${n>1?' – '+fmtDate(h.end):''}<small class="muted"> · ${n} ${n===1?'day':'days'}</small>`};
function holidaysSection(){
  const T=TD(),list=[...S.holidays].sort((a,b)=>a.start<b.start?-1:1),up=list.filter(h=>h.end>=T),past=list.length-up.length;
  const P=ui.holPreview,tab=ui.holTab;
  return `<section class="sec" id="holidays">
    <div class="sh"><h2>School holidays</h2><span class="aside">No classes on these days. The whole day becomes study time, and the plan uses it.</span></div>
    <div class="seg" role="tablist" style="margin-bottom:12px">${[['paste','Paste list'],['link','Google Sheets link'],['file','Upload file']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${tab===k}" data-act="holtab" data-t="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}</div>
    ${tab==='link'?`<form class="toolbar" id="holLink" style="padding:0"><label class="field q"><span>Link to the holiday list</span><input class="in" id="hol-url" type="url" required placeholder="https://docs.google.com/spreadsheets/d/…"></label><button class="btn" type="submit" ${ui.holBusy?'disabled':''}>${ui.holBusy?'Reading…':'Read holidays'}</button></form>`
    :tab==='file'?`<div class="drop" id="holDrop"><div style="min-width:0;flex:1 1 300px"><b style="font-weight:500">Upload the school's holiday list.</b><div class="muted" style="font-size:12.5px;margin-top:3px">Excel, CSV, or a calendar file (.ics) from Google Calendar or the school portal.</div></div>
      <label class="btn sec2" style="position:relative;overflow:hidden">${ic('up')}${ui.holBusy?'Reading…':'Choose file'}<input type="file" id="holFile" accept=".xlsx,.xls,.ods,.csv,.tsv,.txt,.ics" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div>`
    :`<div style="display:flex;flex-direction:column;gap:8px"><label class="field"><span>Paste the list from the school circular, an email or a spreadsheet, one holiday per line</span><textarea class="in" id="holPaste" rows="5" style="font-family:var(--sans);font-size:13px" placeholder="Diwali break    28 Oct – 3 Nov 2026&#10;Guru Nanak Jayanti, 24/11/2026&#10;Winter vacation: 24 Dec 2026 to 2 Jan 2027"></textarea></label><div><button class="btn" data-act="hol-paste" ${ui.holBusy?'disabled':''}>${ui.holBusy?'Reading…':'Read holidays'}</button></div></div>`}
    ${ui.holMsg?`<div class="warn" style="margin-top:12px;border:0"><span>${esc(ui.holMsg)}</span></div>`:''}
    ${P?`<div id="holPreview" style="margin-top:16px;border-top:2px solid var(--gold);padding-top:12px">
      <div class="sh"><h2>Check the dates</h2><span class="aside">${esc(P.source)} · ${P.list.length} found</span></div>
      <div class="tw" style="border-top:0"><table><thead><tr><th>Holiday</th><th>Dates</th></tr></thead><tbody>${P.list.map(h=>`<tr><td>${esc(h.name)}</td><td class="num">${holLabel(h)}</td></tr>`).join('')}</tbody></table></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:12px 0"><button class="btn" data-act="hol-apply">Add ${P.list.length} ${P.list.length===1?'holiday':'holidays'}</button><button class="btn ghost" data-act="hol-cancel">Discard</button></div></div>`:''}
    <div class="tw" style="margin-top:14px"><table><thead><tr><th>Holiday</th><th>Dates</th><th></th></tr></thead><tbody>
      ${up.map(h=>`<tr><td>${esc(h.name)}${h.start<=T?' <span class="kind" style="color:var(--gold);margin-left:6px">Now</span>':''}</td><td class="num">${holLabel(h)}</td><td class="r"><span class="rowact"><button class="icon" data-act="del-hol" data-id="${h.id}" aria-label="Remove">${ic('del')}</button></span></td></tr>`).join('')||`<tr><td colspan="3" class="empty">No upcoming holidays added yet.</td></tr>`}
    </tbody></table></div>
    ${past?`<p class="muted" style="font-size:12.5px;margin:8px 0 0">${past} past ${past===1?'holiday':'holidays'} hidden.</p>`:''}
    <form class="form" id="holForm" autocomplete="off" style="grid-template-columns:minmax(0,2fr) repeat(2,minmax(0,1fr)) auto">
      <label class="field f-title"><span>Add one by hand</span><input class="in" id="hf-name" required placeholder="e.g. Diwali break"></label>
      <label class="field"><span>From</span><input class="in num" type="date" id="hf-s" required></label>
      <label class="field"><span>To</span><input class="in num" type="date" id="hf-e"></label>
      <div class="acts"><button class="btn sec2" type="submit">Add</button></div>
    </form>
  </section>`;
}

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
function dayFlags(day){const evs=S.events.filter(e=>e.allDay&&e.day===day);const h=S.holidays.find(x=>x.start<=day&&x.end>=day);return{holiday:!!h||evs.some(e=>e.kind==='holiday'),holidayName:h?h.name:(evs.find(e=>e.kind==='holiday')||{}).title,away:evs.some(e=>e.kind==='away')}}
function classesOn(day,generic){const wd=parse(day).getDay();if(!generic&&dayFlags(day).holiday)return[];return S.classes.filter(c=>c.dow.includes(wd)&&(generic||!(c.skip||[]).includes(day)))}
function fixedOn(day){
  const wd=parse(day).getDay(),out=[];
  for(const c of classesOn(day))out.push({id:c.id,src:'class',kind:'class',title:sub(c.subject).name,subject:c.subject,room:c.room,start:c.start,end:c.end});
  for(const e of S.events)if(e.day===day||(Array.isArray(e.dow)&&e.dow.includes(wd)&&!(e.skip||[]).includes(day)))out.push({...e,src:'event'});
  for(const h of S.holidays)if(h.start<=day&&h.end>=day)out.push({id:h.id,src:'holiday',kind:'holiday',title:h.name,allDay:true,start:'00:00',end:'23:59'});
  for(const t of S.tests)if(t.date===day)out.push({id:t.id,src:'test',kind:'test',title:t.title,subject:t.subject,start:t.time,end:fromMin(toMin(t.time)+(t.dur||60))});
  return out.sort((a,b)=>(b.allDay?1:0)-(a.allDay?1:0)||toMin(a.start)-toMin(b.start));
}
const minsOn=day=>S.log.filter(l=>l.date===day).reduce((a,l)=>a+l.min,0);
function weekMins(off=0){const ws=weekStart(addDays(today(),off*7));const a=iso(ws),b=iso(addDays(ws,6));return S.log.filter(l=>l.date>=a&&l.date<=b).reduce((s,l)=>s+l.min,0)}
function revStats(sid){const r=S.revision.filter(x=>!sid||x.subject===sid);return{done:r.filter(x=>x.done).length,total:r.length}}

/* =========================================================
   Planner
   ========================================================= */
const GAP=5;
function mergeIv(iv){iv=iv.map(x=>[x[0],x[1]]).sort((a,b)=>a[0]-b[0]);const o=[];for(const x of iv){if(o.length&&x[0]<=o[o.length-1][1])o[o.length-1][1]=Math.max(o[o.length-1][1],x[1]);else o.push(x)}return o}
function subIv(iv,s,e){const o=[];for(const[a,b] of iv){if(e<=a||s>=b){o.push([a,b]);continue}if(s>a)o.push([a,s]);if(e<b)o.push([e,b])}return o}
function freeWindows(day,generic){
  const st=S.settings;if(!generic&&dayFlags(day).away)return[];
  const cls=classesOn(day,generic),end=toMin(st.dayEnd);
  const start=cls.length?Math.max(...cls.map(c=>toMin(c.end)))+(+st.travel||0):toMin(st.dayStart);
  let iv=start<end?[[start,end]]:[];
  if(!cls.length){const l=toMin(st.lunch);iv=subIv(iv,l,l+45)}
  if(+st.dinnerMin>0){const d=toMin(st.dinner);iv=subIv(iv,d,d+(+st.dinnerMin))}
  return iv.filter(([a,b])=>b-a>=10);
}
function availOn(day){let iv=freeWindows(day);for(const x of fixedOn(day))if(!x.allDay)iv=subIv(iv,toMin(x.start)-(x.kind==='class'?0:GAP),toMin(x.end)+GAP);return iv.filter(([a,b])=>b-a>=10)}
function freeOn(day){
  let iv=availOn(day);
  for(const b of [...S.doneBlocks,...liveBlocks()])if(b.day===day)iv=subIv(iv,toMin(b.start),toMin(b.end)+GAP);
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
  const st=S.settings,T=TD(),lead=Math.max(0,...S.tests.filter(t=>t.date>=T).map(t=>Math.min(42,diffDays(T,t.date)))),H=Math.max(7,Math.min(42,Math.max(+st.horizon||28,lead+1)));
  const days=[...Array(H)].map((_,i)=>iso(addDays(today(),i)));
  const fr={};days.forEach(d=>fr[d]=freeOn(d));
  const pre=liveBlocks();
  const doneKeys=new Set([...S.doneBlocks,...pre].map(b=>b.key));
  const blocks=S.doneBlocks.map(b=>({...b,done:true})).concat(pre.map(b=>({...b,done:false,live:true})));
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
    const N=prepDaysFor(t);
    for(let i=N;i>=1;i--){
      const d=iso(addDays(parse(t.date),-i));if(d<T||!fr[d])continue;
      const key=`prep:${t.id}:${d}`;if(doneKeys.has(key))continue;
      const off=!classesOn(d).length,base=+st.prepMin;
      const min=i<=2?base+15:i<=7?base:Math.max(20,base-5);
      const len=off&&i<=7?min+15:min;
      const s=takeEarly(fr[d],len)||takeUpTo(fr[d],len,20);
      if(s)add(d,s,{key,kind:'prep',ref:t.id,subject:t.subject,title:`Prep: ${t.title}`});else if(d!==T)missed++;
    }
    if(missed)warnings.push({type:'prep',text:`${missed} prep ${missed===1?'session':'sessions'} for “${t.title}” could not fit. Add free time in the ${N} days before ${fmtDate(t.date)}.`});
  }
  // 3. Homework, earliest deadline first, spread across the days before it is due.
  const tasks=openTasks().sort(byNext);
  const tgt=d=>+(classesOn(d).length?st.studyDay:st.studyWeekend)||0;
  const load=d=>blocks.filter(b=>b.day===d&&b.kind!=='read'&&b.kind!=='paper').reduce((a,b)=>a+b.min,0);
  for(const t of tasks){
    const doneMin=[...S.doneBlocks,...pre].filter(b=>b.kind==='hw'&&b.ref===t.id).reduce((a,b)=>a+b.min,0);
    let rem=Math.max(0,(+t.est||0)-doneMin);if(!rem)continue;
    let last=t.due<=T?T:iso(addDays(parse(t.due),-1));
    if(t.due<T)last=iso(addDays(today(),1));
    const span=days.filter(d=>d<=last);
    if(!span.length){warnings.push({type:'hw',text:`“${t.title}” is due after the planning window, so it isn't scheduled yet.`});continue}
    // Water-fill: raise each day's allowance in 30-minute steps so work spreads evenly before the deadline.
    for(let extra=0;rem>0&&extra<=720;extra+=30){
      for(const d of span){
        if(rem<=0)break;
        let cap=tgt(d)+extra-load(d);const minLen=Math.min(25,rem);
        while(rem>0&&cap>=minLen){
          let want=Math.min(rem,+st.maxBlock,cap);if(rem-want>0&&rem-want<20)want=Math.min(rem,+st.maxBlock+15);if(want<Math.min(25,rem))break;
          const s=takeEarly(fr[d],want)||takeUpTo(fr[d],want,Math.min(25,want));if(!s)break;
          add(d,s,{key:`hw:${t.id}:${d}:${s[0]}`,kind:'hw',ref:t.id,subject:t.subject,title:t.title});
          const m=s[1]-s[0];rem-=m;cap-=m;
        }
      }
    }
    if(rem>=15)warnings.push({type:'hw',ref:t.id,text:`${fmtMin(rem)} of “${t.title}” doesn't fit before ${t.due<T?'tomorrow':fmtDate(t.due)}. Add free time or lower the estimate.`});
  }
  // 4. Revision sessions: top each day up to the daily study target, favouring subjects with tests coming up.
  const ids=new Set([...S.classes.map(c=>c.subject),...S.tests.map(t=>t.subject),...S.tasks.map(t=>t.subject)]);
  let cand=S.subjects.filter(x=>ids.has(x.id));if(!cand.length)cand=S.subjects.slice();
  const last={};for(const l of S.log)if(l.subject&&(!last[l.subject]||l.date>last[l.subject]))last[l.subject]=l.date;
  const count={};
  for(const d of days){
    const off=!classesOn(d).length,target=+(off?st.studyWeekend:st.studyDay)||0;if(!target||!cand.length)continue;
    let need=target-blocks.filter(b=>b.day===d&&b.kind!=='read'&&b.kind!=='paper').reduce((a,b)=>a+b.min,0);
    const used=new Set(blocks.filter(b=>b.day===d&&b.subject).map(b=>b.subject));
    for(let g=0;g<8&&need>=20;g++){
      const ranked=cand.map(x=>{let sc=1;
        for(const t of S.tests)if(t.subject===x.id&&t.date>d){const n=diffDays(d,t.date);if(n<=21)sc+=(1-(+t.prep||0)/100)*12/(n+1)}
        sc+=Math.min(7,last[x.id]?Math.max(0,diffDays(last[x.id],d)):7)*.15;sc-=(count[x.id]||0)*.25;if(used.has(x.id))sc-=3;return{x,sc}}).sort((a,b)=>b.sc-a.sc);
      const x=ranked[0].x,len=Math.max(20,Math.min(+st.maxBlock,Math.floor(need/5)*5));
      const slot=takeEarly(fr[d],len)||takeUpTo(fr[d],len,20);if(!slot)break;
      const topic=S.revision.find(r=>r.subject===x.id&&!r.done);
      add(d,slot,{key:`study:${d}:${slot[0]}`,kind:'study',ref:x.id,subject:x.id,title:`Revise ${x.name}${topic?': '+topic.topic:''}`});
      need-=slot[1]-slot[0];used.add(x.id);count[x.id]=(count[x.id]||0)+1;last[x.id]=d;
    }
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

function liveBlocks(){return typeof F!=='undefined'&&F.started&&F.block?[F.block]:[]}
function markBlock(key,on,actual,obj){
  if(on){
    if(S.doneBlocks.some(b=>b.key===key))return;
    const b=obj||plan().blocks.find(x=>x.key===key);if(!b)return;
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
function currentView(){const h=(location.hash||'').replace('#','');if(h==='holidays')return 'timetable';return [...VIEWS,...VIEWS_B].some(v=>v[0]===h)?h:'dashboard'}
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
function planRow(b){
  const T=TD(),live=F.started&&F.block&&F.block.key===b.key,past=b.day===T&&!b.done&&!live&&toMin(b.end)<=nowHM();
  let act;
  if(b.done)act='<span class="muted" style="font-size:12px">Done</span>';
  else if(live)act=`<span class="live num" data-clock>${clockTxt(F.remaining)}</span>${F.running?'<button class="btn sec2 sm" data-act="t-pause">Pause</button>':`<button class="btn sm" data-act="t-resume">${ic('play')}Resume</button>`}<button class="btn sec2 sm" data-act="t-end">Finish</button>`;
  else act=`<button class="btn sec2 sm" data-act="run-block" data-key="${esc(b.key)}" ${F.started?'disabled title="Finish the running session first"':''}>${ic('play')}Start ${b.min} min</button>`;
  return `<div class="prow ${b.done?'done':''} ${past?'past':''} ${live?'live-row':''}">
    <input type="checkbox" class="ck" data-block="${esc(b.key)}" ${b.done?'checked':''} aria-label="Mark ${esc(b.title)} done">
    <span class="tm num">${b.start}<small>${b.end}</small></span>
    <span class="tt"><span class="ttl">${esc(b.title)}</span><small><i class="sq" style="background:${planColor(b)}"></i>${PLANL[b.kind]}${b.subject&&b.kind!=='study'?' · '+esc(sub(b.subject).name):''} · ${fmtMin(b.min)}</small></span>
    <span class="pacts">${act}</span>
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
    [S.settings.hoursSet,'Check your study hours','Free time comes from your classes. Set when you get home and when you stop.','timetable','Review'],
    [S.tasks.length>0,'Add homework','With the due date and how long it will take.','tasks','Add homework'],
    [S.tests.length>0,'Add upcoming tests','Prep starts up to two weeks before, depending on the subject.','tests','Add tests'],
    [S.holidays.length>0,'Add school holidays','Holidays become full study days in the plan.','timetable','Add holidays']];
  return steps;
}
function timeline(day){
  const T=TD(),nm=nowHM(),isToday=day===T;
  const fixed=fixedOn(day).filter(e=>!e.allDay),blocks=blocksOn(day);
  const items=[...fixed.map(e=>({t:'fixed',s:toMin(e.start),e:toMin(e.end),x:e})),...blocks.map(b=>({t:'plan',s:toMin(b.start),e:toMin(b.end),x:b}))].sort((a,b)=>a.s-b.s||a.e-b.e);
  // Collapse runs of classes into one school block.
  const rows=[];
  for(const it of items){
    const p=rows[rows.length-1];
    if(it.t==='fixed'&&it.x.kind==='class'&&p&&p.t==='school'&&it.s-p.e<=45){p.e=Math.max(p.e,it.e);p.list.push(it.x);continue}
    if(it.t==='fixed'&&it.x.kind==='class'){rows.push({t:'school',s:it.s,e:it.e,list:[it.x]});continue}
    rows.push(it);
  }
  if(!rows.length)return `<div class="empty">Nothing planned${isToday?' today':''}.</div>`;
  const free=availOn(day);
  const out=[];let cursor=null,nowDone=!isToday;
  const nowRow=()=>`<div class="tl-now"><span class="num">${fromMin(nm)}</span><i></i></div>`;
  for(const r of rows){
    if(!nowDone&&nm<r.s){out.push(nowRow());nowDone=true}
    if(cursor!==null&&r.s-cursor>=20){
      const fm=free.reduce((a,[x,y])=>a+Math.max(0,Math.min(y,r.s)-Math.max(x,cursor)),0);
      if(fm>=20)out.push(`<div class="tl-gap"><span></span><span class="rail"></span><span>Free · ${fmtMin(fm)}</span></div>`);
    }
    const past=isToday&&r.e<=nm;
    if(r.t==='school'){
      out.push(`<details class="tl-row school ${past?'past':''}"><summary><span class="tm num">${fromMin(r.s)}<small>${fromMin(r.e)}</small></span><span class="rail"><i></i></span>
        <span class="tl-c"><b>School</b><small>${r.list.length} ${r.list.length===1?'class':'classes'} · ${[...new Set(r.list.map(c=>c.title))].slice(0,4).join(', ')}${new Set(r.list.map(c=>c.title)).size>4?'…':''}</small></span><span class="tl-a muted">Show</span></summary>
        <div class="tl-sub">${r.list.map(c=>`<div><span class="num">${c.start}–${c.end}</span><span><i class="sq" style="background:${esc(sub(c.subject).color)}"></i>${esc(c.title)}</span><span class="muted">${esc(c.room||'')}</span></div>`).join('')}</div></details>`);
    }else if(r.t==='fixed'){
      const e=r.x;
      out.push(`<div class="tl-row ${e.kind} ${past?'past':''}" style="--c:${evColor(e)}"><span class="tm num">${e.start}<small>${e.end}</small></span><span class="rail"><i></i></span>
        <span class="tl-c"><b>${esc(e.title)}</b><small>${KINDS[e.kind]||''}${e.room?' · '+esc(e.room):''}</small></span><span class="tl-a"></span></div>`);
    }else{
      const b=r.x,live=F.started&&F.block&&F.block.key===b.key;
      let act;
      if(b.done)act='<span class="done-tag">Done</span>';
      else if(live)act=`<span class="live num" data-clock>${clockTxt(F.remaining)}</span>${F.running?'<button class="btn sec2 sm" data-act="t-pause">Pause</button>':`<button class="btn sm" data-act="t-resume">${ic('play')}Resume</button>`}<button class="btn sec2 sm" data-act="t-end">Finish</button>`;
      else if(isToday)act=`<button class="btn sec2 sm" data-act="run-block" data-key="${esc(b.key)}" ${F.started?'disabled':''}>${ic('play')}Start</button>`;
      else act='';
      out.push(`<div class="tl-row plan ${b.done?'done':''} ${past&&!b.done&&!live?'past':''} ${live?'live':''}" style="--c:${planColor(b)}"><span class="tm num">${b.start}<small>${b.end}</small></span>
        <span class="rail"><input type="checkbox" class="ck tl-ck" data-block="${esc(b.key)}" ${b.done?'checked':''} aria-label="Mark ${esc(b.title)} done"></span>
        <span class="tl-c"><b>${esc(b.title)}</b><small><i class="sq" style="background:${planColor(b)}"></i>${PLANL[b.kind]}${b.subject&&b.kind!=='study'?' · '+esc(sub(b.subject).name):''} · ${fmtMin(b.min)}</small></span><span class="tl-a">${act}</span></div>`);
    }
    cursor=Math.max(cursor??0,r.e);
  }
  if(!nowDone&&isToday)out.push(nowRow());
  return `<div class="tl">${out.join('')}</div>`;
}
function vDashboard(){
  const T=TD(),now=new Date(),hr=now.getHours(),nm=nowHM();
  const P=plan(),open=openTasks().sort(byNext);
  const late=open.filter(t=>t.due<T);
  const upTests=S.tests.filter(t=>t.date>=T).sort((a,b)=>a.date<b.date?-1:1);
  const wk=weekMins(0),goal=(+S.settings.goal||14)*60;
  const greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
  const name=S.settings.name?`, ${esc(S.settings.name)}`:'';
  const todayBlocks=blocksOn(T);
  const planMin=todayBlocks.reduce((a,b)=>a+b.min,0),doneMin=todayBlocks.filter(b=>b.done).reduce((a,b)=>a+b.min,0);
  const next=P.blocks.find(b=>!b.done&&(b.day>T||(b.day===T&&toMin(b.end)>nm)));
  const steps=setupSteps(),setupLeft=steps.filter(s=>!s[0]).length;
  const nextDay=(()=>{for(let i=1;i<8;i++){const d=iso(addDays(today(),i));if(blocksOn(d).some(b=>!b.done))return d}return null})();
  const ws=weekStart(today()),habitDays=[...Array(7)].map((_,i)=>iso(addDays(ws,i)));
  const hasDone=(k,d)=>S.doneBlocks.some(b=>b.kind===k&&b.day===d);
  const habitRow=(k,l)=>`<div class="habit"><span>${l}</span>${habitDays.map(d=>`<i class="${hasDone(k,d)?'y':''} ${d===T?'t':''} ${d>T?'f':''}" title="${fmtDate(d)}"></i>`).join('')}</div>`;
  const hol=dayFlags(T).holidayName;
  const upHol=S.holidays.filter(h=>h.end>=T).sort((a,b)=>a.start<b.start?-1:1)[0];
  const dueLabel=t=>{const n=diffDays(T,t.due);return n<0?`${-n} d overdue`:n===0?'today':n===1?'tomorrow':fmtDate(t.due)};

  return `
  <div class="phead">
    <div><h1>${greet}${name}</h1><div class="sub">${DOWL[now.getDay()]} ${now.getDate()} ${MONL[now.getMonth()]} ${now.getFullYear()} · Week ${isoWeek(now)}${hol?` · <span style="color:var(--gold)">${esc(hol)}</span>`:''}</div></div>
    <dl class="overview num">
      <div><dt>Study today</dt><dd>${fmtMin(doneMin)}<span class="of"> / ${fmtMin(planMin)}</span></dd></div>
      <div><dt>Overdue</dt><dd class="${late.length?'red':''}">${late.length}</dd></div>
      <div><dt>Tests in 14 days</dt><dd>${upTests.filter(t=>diffDays(T,t.date)<=14).length}</dd></div>
      <div><dt>This week</dt><dd>${fmtH(wk)}<span class="of"> / ${S.settings.goal} h</span></dd></div>
    </dl>
  </div>
  <div class="grid2 dash">
    <div>
      ${setupLeft?`<section class="sec"><div class="sh"><h2>Set up your planner</h2><span class="aside num">${steps.length-setupLeft} of ${steps.length} done</span></div>
        <div class="steps">${steps.map(([ok,t,d,v,l])=>`<div class="step ${ok?'ok':''}"><div><b>${t}</b><small>${d}</small></div>${ok?'<span></span>':`<a class="btn sec2 sm" href="#${v}">${l}</a>`}</div>`).join('')}</div>
        ${!S.classes.length&&!S.tasks.length?`<div style="padding:12px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:13px">Want to see how it works first?</span><button class="btn ghost sm" data-act="confirm" data-c="example" style="padding:0">Load an example week</button>${ui.confirm==='example'?'<button class="btn danger sm" data-act="do-example">Replace my data with the example</button>':''}</div>`:''}
      </section>`:''}
      ${next?`<div class="next">
        <div style="min-width:0"><div class="label">${next.day===T&&toMin(next.start)<=nm?'Now':next.day===T?'Next':'Next · '+fmtDate(next.day)}</div><h3>${esc(next.title)}</h3>
          <div class="meta">${next.subject?subjMark(next.subject):''}<span class="num">${next.start}–${next.end}</span><span>${PLANL[next.kind]} · ${fmtMin(next.min)}</span></div></div>
        <div class="next-a">${F.started&&F.block&&F.block.key===next.key?`<span class="live num big-live" data-clock>${clockTxt(F.remaining)}</span>`:`<button class="btn" data-act="run-block" data-key="${esc(next.key)}" ${F.started?'disabled':''}>${ic('play')}Start ${next.min} min</button>`}<button class="btn sec2" data-act="focus-block" data-key="${esc(next.key)}" title="Full-screen timer">${ic('full')}Focus</button></div></div>`:''}

      <section class="sec">
        <div class="sh"><h2>Today</h2><span class="aside num">${planMin?`${fmtMin(doneMin)} of ${fmtMin(planMin)} studied · `:''}<button class="btn ghost sm" style="padding:0;height:auto" data-act="cal-open" data-day="${T}">Calendar</button></span></div>
        ${timeline(T)}
      </section>

      ${nextDay?`<section class="sec">
        <div class="sh"><h2>${nextDay===iso(addDays(today(),1))?'Tomorrow':DOWL[parse(nextDay).getDay()]}</h2><span class="aside num">${fmtDate(nextDay)} · ${fmtMin(blocksOn(nextDay).reduce((a,b)=>a+b.min,0))} planned · <button class="btn ghost sm" style="padding:0;height:auto" data-act="cal-open" data-day="${nextDay}">Calendar</button></span></div>
        <div class="mini">${blocksOn(nextDay).map(b=>`<div><span class="num">${b.start}</span><i class="sq" style="background:${planColor(b)}"></i><span class="t">${esc(b.title)}</span><span class="num muted">${fmtMin(b.min)}</span></div>`).join('')}</div>
      </section>`:''}
    </div>

    <div class="col2">
      ${P.warnings.length?`<section class="sec"><div class="sh"><h2>Plan needs attention</h2><span class="aside num">${P.warnings.length}</span></div>${P.warnings.slice(0,4).map(w=>`<div class="warn"><span>${esc(w.text)}</span></div>`).join('')}${P.warnings.length>4?`<div class="muted" style="font-size:12.5px;padding-top:6px">and ${P.warnings.length-4} more</div>`:''}</section>`:''}
      <section class="sec">
        <div class="sh"><h2>Upcoming tests</h2><a class="aside" href="#tests">All tests</a></div>
        ${upTests.slice(0,4).map(t=>{const n=diffDays(T,t.date),pd=prepDaysFor(t),pr=P.blocks.filter(b=>b.kind==='prep'&&b.ref===t.id),ps=iso(addDays(parse(t.date),-pd));return `<div class="cd"><div class="n num ${n<=2?'soon':''}">${n}<small>${n===1?'day':'days'}</small></div>
          <div class="x">${esc(t.title)}<small>${esc(sub(t.subject).name)} · ${fmtDate(t.date)}</small>
          <div class="bar gold" style="margin:7px 0 4px"><span style="width:${t.prep}%"></span></div><small>${ps>T?`Prep starts ${fmtDate(ps)}`:`${pr.filter(b=>b.done).length} of ${pr.length} prep sessions done`} · ready ${t.prep}%</small></div></div>`}).join('')||'<div class="empty">No tests scheduled. <a href="#tests">Add one</a>.</div>'}
      </section>
      <section class="sec">
        <div class="sh"><h2>Homework due</h2><a class="aside" href="#tasks">${open.length?`All ${open.length}`:'Add'}</a></div>
        ${open.slice(0,5).map(t=>`<div class="hw ${t.due<T?'late':''}"><input type="checkbox" class="ck" data-toggle="${t.id}" aria-label="Mark ${esc(t.title)} done"><div><span class="t">${esc(t.title)}</span><small><i class="sq" style="background:${esc(sub(t.subject).color)}"></i>${esc(sub(t.subject).name)} · <span class="${t.due<T?'red':''}">due ${dueLabel(t)}</span> · ${fmtMin(t.est)}</small></div></div>`).join('')||'<div class="empty">Nothing due.</div>'}
      </section>
      ${upHol?`<section class="sec"><div class="sh"><h2>Next holiday</h2><a class="aside" href="#timetable">All holidays</a></div><div class="hw nock"><div><span class="t">${esc(upHol.name)}</span><small>${fmtDate(upHol.start)}${upHol.end!==upHol.start?' – '+fmtDate(upHol.end):''} · ${upHol.start<=T?'now':diffDays(T,upHol.start)+' days away'}</small></div></div></section>`:''}
      <section class="sec">
        <div class="sh"><h2>Daily habits</h2></div>
        <div class="habit hd"><span></span>${['M','T','W','T','F','S','S'].map(x=>`<span>${x}</span>`).join('')}</div>
        ${habitRow('read',`Reading · ${S.settings.readMin} min`)}${habitRow('paper',`Past papers · ${S.settings.paperMin} min`)}
      </section>
      <section class="sec">
        <div class="sh"><h2>Study this week</h2><span class="aside num">${fmtH(wk)} of ${S.settings.goal} h</span></div>
        <div class="bar" style="margin:2px 0 14px"><span style="width:${Math.min(100,wk/goal*100)}%"></span></div>
        ${wk?weekChart():'<div class="empty" style="padding:4px 0 8px">Nothing logged yet this week. Finish a session and it shows here.</div>'}
      </section>
    </div>
  </div>`;
}

/* =========================================================
   Timetable: classes, study hours and import
   ========================================================= */
/* ---- Reading spreadsheets ---- */
function parseDelimited(txt){
  txt=String(txt||'').replace(/^﻿/,'');
  const first=txt.split(/\r?\n/)[0]||'';
  const delim=first.split('\t').length>1?'\t':(first.split(';').length>first.split(',').length?';':',');
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<txt.length;i++){
    const ch=txt[i];
    if(q){if(ch==='"'){if(txt[i+1]==='"'){cell+='"';i++}else q=false}else cell+=ch;continue}
    if(ch==='"'&&cell===''){q=true;continue}
    if(ch===delim){row.push(cell);cell='';continue}
    if(ch==='\n'||ch==='\r'){if(ch==='\r'&&txt[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';continue}
    cell+=ch;
  }
  if(cell!==''||row.length){row.push(cell);rows.push(row)}
  return rows.map(r=>r.map(c=>String(c).trim()));
}
function loadXLSX(){return window.XLSX?Promise.resolve():new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=res;s.onerror=()=>rej(new Error('load'));document.head.appendChild(s)})}
async function sheetsFromWorkbook(buf){
  await loadXLSX();
  const wb=window.XLSX.read(buf,{type:'array'});
  return wb.SheetNames.map(n=>{
    const ws=wb.Sheets[n];const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''}).map(r=>r.map(c=>String(c??'').trim()));
    for(const m of ws['!merges']||[]){const v=(rows[m.s.r]||[])[m.s.c];if(!v)continue;for(let r=m.s.r;r<=m.e.r;r++){rows[r]=rows[r]||[];for(let c=m.s.c;c<=m.e.c;c++)if(!rows[r][c])rows[r][c]=v}}
    return {name:n,rows};
  });
}
async function fetchGoogleSheet(url){
  const id=(url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)||[])[1];
  if(!id)throw new Error('link');
  const gid=(url.match(/[#&?]gid=(\d+)/)||[])[1];
  const tries=[
    `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid?`&gid=${gid}`:''}`,
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=0${gid?`&gid=${gid}`:''}`];
  for(const u of tries){
    try{const r=await fetch(u);if(!r.ok)continue;const t=await r.text();if(/<html/i.test(t.slice(0,300)))continue;return parseDelimited(t)}catch(e){}
  }
  throw new Error('access');
}

/* ---- Understanding a timetable in any layout ---- */
const DAYNAMES=['sun','mon','tue','wed','thu','fri','sat'];
function dayIdx(t){const m=String(t??'').trim().toLowerCase().match(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?$/);return m?DAYNAMES.indexOf(m[1]):-1}
const TRE=/(\d{1,2})[:.](\d{2})\s*([ap]\.?\s?m\.?)?/gi;
function timesIn(t){const out=[];let m;const re=new RegExp(TRE.source,'gi');while((m=re.exec(String(t??''))))out.push({h:+m[1],m:+m[2],ap:m[3]?m[3].toLowerCase()[0]:''});return out.filter(x=>x.h<24&&x.m<60)}
function toMins(x){let h=x.h;if(x.ap==='p'&&h<12)h+=12;if(x.ap==='a'&&h===12)h=0;if(!x.ap&&h<7)h+=12;return h*60+x.m}
function rangeIn(t){const ts=timesIn(t);if(!ts.length)return null;const s=toMins(ts[0]);let e=ts[1]?toMins(ts[1]):null;if(e!==null&&e<=s)e=null;return{s,e}}
const isTimeish=c=>timesIn(c).length>0&&String(c).replace(new RegExp(TRE.source,'gi'),'').replace(/[\s\-–—:to()|,.]/gi,'').replace(/^(period|p|lesson|l)?\d*/i,'').length<3;
const SKIPCELL=/^(short |long |lunch |snack )?(break|lunch|recess|snack|free|free period|study period|self study|zero period|dispersal|assembly)( break)?$/i;
function parseCell(t){
  const lines=String(t??'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length)return null;
  let first=lines[0];
  if(SKIPCELL.test(first)||/^[-–—x.\/]+$/i.test(first)||/^(n\/?a|nil|none)$/i.test(first))return null;
  if(isTimeish(first)||dayIdx(first)>=0)return null;
  let room='';
  const m=first.match(/^(.*?)\s*[\(\[]\s*(.+?)\s*[\)\]]\s*$/)||first.match(/^(.*?)\s+[-–—,\/@|]\s*((?:rm|room|lab|hall|class|r)\b.*|\d{1,3}[a-z]?)$/i);
  if(m&&m[1].trim()){first=m[1].trim();room=m[2].trim()}
  if(!room&&lines.length>1)room=lines.slice(1).find(l=>/\b(rm|room|lab|hall)\b/i.test(l)||/^[A-Z]?-?\d{1,3}[A-Z]?$/i.test(l))||'';
  const subject=first.replace(/\s+/g,' ').trim();
  if(!subject||/^\d+$/.test(subject)||subject.length>40)return null;
  return {subject,room};
}
function fillEnds(list){for(let i=0;i<list.length;i++){const x=list[i];if(!x||x.e!=null)continue;const nx=list.slice(i+1).find(y=>y&&y.s>x.s);x.e=nx?nx.s:x.s+45}}
function analyseRowsFmt(rows){
  const out=[];
  for(const r of rows){
    const di=r.findIndex(c=>dayIdx(c)>=0);if(di<0)continue;
    let rg=null;const used=new Set([di]);
    r.forEach((c,i)=>{if(used.has(i)||!isTimeish(c))return;const x=rangeIn(c);if(!x)return;if(!rg){rg={...x};used.add(i)}else if(rg.e==null){rg.e=x.s;used.add(i)}});
    if(!rg)continue;
    const rest=r.filter((c,i)=>!used.has(i)&&c&&!/^\d+$/.test(c));
    const cell=rest.length?parseCell(rest[0]):null;if(!cell)continue;
    if(!cell.room&&rest[1]&&rest[1].length<20)cell.room=rest[1];
    out.push({dow:dayIdx(r[di]),s:rg.s,e:rg.e,...cell});
  }
  const byDay={};out.forEach(x=>(byDay[x.dow]=byDay[x.dow]||[]).push(x));
  Object.values(byDay).forEach(l=>{l.sort((a,b)=>a.s-b.s);fillEnds(l)});
  return out;
}
function analyseAcross(rows){
  let best=[];
  for(let h=0;h<Math.min(rows.length,20);h++){
    const dc={};(rows[h]||[]).forEach((c,i)=>{const d=dayIdx(c);if(d>=0)dc[i]=d});
    if(Object.keys(dc).length<2)continue;
    const tr=[];
    for(let r=h+1;r<rows.length;r++){
      const row=rows[r]||[];
      if(Object.keys(dc).filter(i=>dayIdx(row[i])>=0).length>=2)break;
      const tcell=row.filter((c,i)=>!(i in dc)&&isTimeish(c)).join(' – ');
      const rg=rangeIn(tcell);tr.push(rg?{r,...rg}:null);
    }
    fillEnds(tr);
    const out=[];
    for(const x of tr){if(!x)continue;for(const i in dc){const cell=parseCell((rows[x.r]||[])[i]);if(cell)out.push({dow:dc[i],s:x.s,e:x.e,...cell})}}
    if(out.length>best.length)best=out;
  }
  return best;
}
function analyseDown(rows){
  let best=[];const width=Math.max(0,...rows.map(r=>r.length));
  for(let c=0;c<Math.min(width,4);c++){
    const dr=rows.map((r,i)=>[i,dayIdx((r||[])[c])]).filter(x=>x[1]>=0);
    if(dr.length<2)continue;
    let hr=-1,bn=0;
    for(let r=Math.max(0,dr[0][0]-8);r<dr[0][0];r++){const n=(rows[r]||[]).filter((x,i)=>i!==c&&isTimeish(x)).length;if(n>bn){bn=n;hr=r}}
    if(hr<0)continue;
    const cols=(rows[hr]||[]).map((x,i)=>i!==c&&isTimeish(x)?{i,...rangeIn(x)}:null);
    const list=cols.filter(Boolean);fillEnds(list);
    const out=[];
    for(const[ri,d] of dr)for(const col of list){const cell=parseCell((rows[ri]||[])[col.i]);if(cell)out.push({dow:d,s:col.s,e:col.e,...cell})}
    if(out.length>best.length)best=out;
  }
  return best;
}
function analyseTimetable(rows){
  rows=(rows||[]).filter(r=>Array.isArray(r));
  const cands=[['rows',analyseRowsFmt(rows)],['across',analyseAcross(rows)],['down',analyseDown(rows)]].sort((a,b)=>b[1].length-a[1].length);
  let list=cands[0][1].filter(x=>x.e>x.s);
  list.sort((a,b)=>a.dow-b.dow||a.s-b.s);
  const merged=[];
  for(const x of list){
    const p=merged[merged.length-1];
    if(p&&p.dow===x.dow&&p.subject.toLowerCase()===x.subject.toLowerCase()&&(p.room||'')===(x.room||'')&&x.s-p.e<=10&&x.s>=p.s){p.e=Math.max(p.e,x.e);continue}
    if(p&&p.dow===x.dow&&p.s===x.s&&p.subject===x.subject)continue;
    merged.push({...x});
  }
  return {layout:cands[0][0],classes:merged};
}
const ALIASES=[['mathematics','maths','math','mat'],['physics','phy','phys'],['chemistry','chem','che'],['biology','bio'],['english','eng','english language','english literature','eng lit','literature'],['history','hist'],['geography','geo','geog'],['computer science','computers','comp sci','cs','ict','computing','computer'],['economics','eco','econ'],['physical education','pe','games','sports'],['business studies','business','bst'],['accountancy','accounts','acc'],['social studies','sst','social science'],['environmental science','evs','environment'],['french','fr'],['hindi','hin'],['spanish','span'],['art','arts','art and design'],['music','mus']];
function matchSubject(name){
  const n=name.toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,' ').trim();
  const exact=S.subjects.find(s=>s.name.toLowerCase()===n);if(exact)return exact;
  const grp=ALIASES.find(g=>g.includes(n)||g.some(a=>a.length>3&&n.startsWith(a)));
  if(grp){const s=S.subjects.find(s=>grp.includes(s.name.toLowerCase()));if(s)return s}
  if(n.length>=4){const s=S.subjects.find(s=>s.name.toLowerCase().startsWith(n)||n.startsWith(s.name.toLowerCase()));if(s)return s}
  return null;
}
function prettyName(name){const n=name.replace(/\s+/g,' ').trim();const k=n.toLowerCase().replace(/[^a-z ]/g,'').trim();const grp=ALIASES.find(g=>g.includes(k));const base=grp?grp[0]:n;return base.length<=3&&!grp?base.toUpperCase():base.replace(/\b\w/g,c=>c.toUpperCase())}
function buildPreview(found,source){
  const subjects={};
  for(const c of found.classes){const k=c.subject.toLowerCase();if(!subjects[k]){const m=matchSubject(c.subject);subjects[k]={raw:c.subject,match:m,name:m?m.name:prettyName(c.subject),count:0}}subjects[k].count++}
  ui.preview={source,layout:found.layout,classes:found.classes,subjects};
}
function applyPreview(mode){
  const p=ui.preview;if(!p)return;
  if(mode==='replace')S.classes=[];
  const idFor={};
  for(const k in p.subjects){const s=p.subjects[k];let sj=s.match||S.subjects.find(x=>x.name.toLowerCase()===s.name.toLowerCase());
    if(!sj){sj={id:uid(),name:s.name,color:PALETTE[S.subjects.length%PALETTE.length]};S.subjects.push(sj)}idFor[k]=sj.id}
  for(const c of p.classes){
    const sid=idFor[c.subject.toLowerCase()],st=fromMin(c.s),en=fromMin(c.e);
    const same=S.classes.find(x=>x.subject===sid&&x.start===st&&x.end===en&&(x.room||'')===(c.room||''));
    if(same){if(!same.dow.includes(c.dow))same.dow.push(c.dow)}else S.classes.push({id:uid(),subject:sid,dow:[c.dow],start:st,end:en,room:c.room||''});
  }
  const n=p.classes.length;ui.preview=null;touch();
  ui.flash=`imp:Added ${n} ${n===1?'class':'classes'} to your timetable. Free time has been worked out from it.`;
}
async function runImport(kind,payload){
  const msg=t=>{ui.impMsg=t;ui.impBusy=false;render()};
  ui.impBusy=true;ui.impMsg='';render();
  try{
    let sheets=[];
    if(kind==='link')sheets=[{name:'Sheet',rows:await fetchGoogleSheet(payload)}];
    else if(kind==='paste')sheets=[{name:'Pasted cells',rows:parseDelimited(payload)}];
    else if(kind==='file'){
      const f=payload;
      if(/\.(xlsx|xlsm|xls|ods)$/i.test(f.name))sheets=await sheetsFromWorkbook(await f.arrayBuffer());
      else sheets=[{name:f.name,rows:parseDelimited(await f.text())}];
    }
    let best=null;
    for(const sh of sheets){const r=analyseTimetable(sh.rows);if(!best||r.classes.length>best.r.classes.length)best={sh,r}}
    if(!best||!best.r.classes.length)return msg('No classes could be found. The sheet needs day names (Mon, Tuesday…) and class times such as 08:00–08:45. Any layout works.');
    buildPreview(best.r,kind==='file'?payload.name+(sheets.length>1?` · ${best.sh.name}`:''):kind==='link'?'Google Sheet':'Pasted cells');
    ui.impBusy=false;ui.impMsg='';render();
    $('#previewSec')?.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(err){
    if(err&&err.message==='link')return msg('That does not look like a Google Sheets link. Copy the address from the browser while the sheet is open.');
    if(err&&err.message==='access')return msg('Could not open that sheet. In Google Sheets, click Share, set General access to “Anyone with the link”, then try again. Or copy the cells and use Paste.');
    if(err&&err.message==='load')return msg('Could not load the spreadsheet reader. Check your connection, or export the sheet as CSV.');
    return msg('That file could not be read. Try exporting it as .xlsx or .csv.');
  }
}

/* ---- Study hours ---- */
function hoursSummary(dow){const d=nextDateFor(dow);const w=availGeneric(d);return{w,tot:w.reduce((a,[x,y])=>a+y-x,0)}}
function nextDateFor(dow){const t=today();return iso(addDays(t,(dow-t.getDay()+7)%7))}
function availGeneric(day){let iv=freeWindows(day,true);for(const c of classesOn(day,true))iv=subIv(iv,toMin(c.start),toMin(c.end));for(const e of S.events)if(Array.isArray(e.dow)&&e.dow.includes(parse(day).getDay()))iv=subIv(iv,toMin(e.start)-GAP,toMin(e.end)+GAP);return iv.filter(([a,b])=>b-a>=10)}

function vTimetable(){
  const clsMin=S.classes.reduce((a,c)=>a+c.dow.length*(toMin(c.end)-toMin(c.start)),0);
  const st=S.settings;
  const days=WEEK.filter(d=>d>=1&&d<=5||S.classes.some(c=>c.dow.includes(d)));
  const shown=days.length<7?[...days,...WEEK.filter(d=>!days.includes(d))]:days;
  const weekFree=WEEK.reduce((a,d)=>a+hoursSummary(d).tot,0);
  const R=gridRange();
  const showPlan=ui.ttPlan!==false;
  if(showPlan)shown.sort((x,y)=>nextDateFor(x)<nextDateFor(y)?-1:1);
  const cols=shown.map(d=>{const day=nextDateFor(d);const bl=showPlan?blocksOn(day):[];const pm=bl.reduce((a,b)=>a+b.min,0);
    return{head:`<b>${DOWL[d]}</b><span class="num" style="font-size:12px;color:var(--slate)">${showPlan?`${fmtDate(day).slice(4)} · ${fmtMin(pm)} study`:`${fmtMin(hoursSummary(d).tot)} free`}</span>`,
    today:day===TD(),slot:null,
    shade:showPlan?availOn(day):availGeneric(day),
    items:S.classes.filter(c=>c.dow.includes(d)).map(c=>({key:`tt|${c.id}|${d}`,s:toMin(c.start),e:toMin(c.end),color:sub(c.subject).color,cls:'class',label:c.room||'Class',title:sub(c.subject).name,sub:`${c.start}–${c.end}`}))
      .concat(S.events.filter(e=>Array.isArray(e.dow)&&e.dow.includes(d)).map(e=>({key:`ttev|${e.id}|${d}`,s:toMin(e.start),e:toMin(e.end),color:'var(--personal)',cls:'personal',label:'Every week',title:e.title,sub:`${e.start}–${e.end}`})))
      .concat(bl.map(b=>({key:`plan|${b.key}|${day}`,s:toMin(b.start),e:toMin(b.end),color:planColor(b),cls:'plan'+(b.done?' done':''),label:PLANL[b.kind],title:b.title,sub:`${b.start}–${b.end}`})))}});
  let sel='';
  if(ui.selEvent&&/^tt/.test(ui.selEvent)){const[k,id,d]=ui.selEvent.split('|');
    if(k==='tt'){const c=S.classes.find(x=>x.id===id);if(c)sel=`<div class="evdetail"><div><span class="kind">Class · ${c.dow.map(x=>DOW[x]).join(', ')}</span><h3>${esc(sub(c.subject).name)}</h3><div class="muted num" style="font-size:13px">${c.start}–${c.end}${c.room?' · '+esc(c.room):''}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${c.dow.length>1?`<button class="btn sec2 sm" data-act="del-class-day" data-id="${c.id}" data-d="${d}">Remove ${DOWL[+d]} only</button>`:''}<button class="btn danger sm" data-act="del-class" data-id="${c.id}">Delete class</button><button class="btn sec2 sm" data-act="sel-ev" data-key="">Close</button></div></div>`}
    else{const e=S.events.find(x=>x.id===id);if(e)sel=`<div class="evdetail"><div><span class="kind personal">Every ${e.dow.map(x=>DOWL[x]).join(', ')}</span><h3>${esc(e.title)}</h3><div class="muted num" style="font-size:13px">${e.start}–${e.end}</div></div><div style="display:flex;gap:8px"><button class="btn danger sm" data-act="del-ev" data-id="${e.id}">Delete</button><button class="btn sec2 sm" data-act="sel-ev" data-key="">Close</button></div></div>`}}
  const P=ui.preview;
  const impTab=ui.impTab;
  const flash=ui.flash&&ui.flash.startsWith('imp:')?ui.flash.slice(4):'';
  return `<div class="phead"><div><h1>Timetable</h1><div class="sub">Import your classes once. Free time to study is worked out from them automatically.</div></div>
    <dl class="overview num"><div><dt>Classes per week</dt><dd>${fmtH(clsMin)}</dd></div><div><dt>Free to study per week</dt><dd>${fmtH(weekFree)}</dd></div></dl></div>

  <section class="sec" style="border:0">
    <div class="sh"><h2>Import your timetable</h2><span class="aside">Any layout: days across the top, days down the side, or one class per row</span></div>
    <div class="seg" role="tablist" style="margin-bottom:12px">${[['link','Google Sheets link'],['file','Upload file'],['paste','Paste cells']].map(([k,l])=>`<button type="button" role="tab" aria-selected="${impTab===k}" data-act="imptab" data-t="${k}" class="${impTab===k?'on':''}">${l}</button>`).join('')}</div>
    ${impTab==='link'?`<form class="toolbar" id="impLink" style="padding:0"><label class="field q"><span>Link to your Google Sheet</span><input class="in" id="imp-url" type="url" required placeholder="https://docs.google.com/spreadsheets/d/…" value="${esc(ui.impUrl||'')}"></label><button class="btn" type="submit" ${ui.impBusy?'disabled':''}>${ui.impBusy?'Reading…':'Read timetable'}</button></form>
      <p class="muted" style="font-size:12.5px;margin:8px 0 0">In Google Sheets, click <b>Share</b> and set General access to <b>Anyone with the link · Viewer</b>. If the timetable is on a second tab, open that tab before copying the link.</p>`
    :impTab==='file'?`<div class="drop" id="drop"><div style="min-width:0;flex:1 1 300px"><b style="font-weight:500">Drop your timetable here, or choose a file.</b>
      <div class="muted" style="font-size:12.5px;margin-top:3px">Excel (.xlsx), Google Sheets download, or CSV. Every tab is checked. <a href="timetable-template.csv" download>Example file</a></div></div>
      <label class="btn sec2" style="position:relative;overflow:hidden">${ic('up')}${ui.impBusy?'Reading…':'Choose file'}<input type="file" id="clsFile" accept=".xlsx,.xls,.ods,.csv,.tsv,.txt" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div>`
    :`<div style="display:flex;flex-direction:column;gap:8px"><label class="field"><span>In Google Sheets, select your whole timetable, copy it (Ctrl+C or ⌘C) and paste it here</span><textarea class="in" id="clsPaste" rows="6" style="font-family:var(--sans);font-size:13px" placeholder="Paste here"></textarea></label><div><button class="btn" data-act="imp-paste" ${ui.impBusy?'disabled':''}>${ui.impBusy?'Reading…':'Read timetable'}</button></div></div>`}
    ${ui.impMsg?`<div class="warn" style="margin-top:12px;border:0"><span>${esc(ui.impMsg)}</span></div>`:''}
    ${flash?`<div class="ok" style="margin-top:10px">${esc(flash)}</div>`:''}
  </section>

  ${P?`<section class="sec" id="previewSec">
    <div class="sh"><h2>Check what was found</h2><span class="aside">${esc(P.source)} · ${{rows:'one class per row',across:'days across the top',down:'days down the side'}[P.layout]}</span></div>
    <p style="margin:0 0 10px;font-size:13.5px"><b class="num" style="font-weight:500">${P.classes.length} classes</b> on ${[...new Set(P.classes.map(c=>c.dow))].sort((a,b)=>(a+6)%7-(b+6)%7).map(d=>DOW[d]).join(', ')}, from ${fromMin(Math.min(...P.classes.map(c=>c.s)))} to ${fromMin(Math.max(...P.classes.map(c=>c.e)))}. Double periods have been joined. Breaks and lunch are left out.</p>
    <div class="tw" style="border-top:0;margin-bottom:12px"><table><thead><tr><th>In your sheet</th><th>Becomes</th><th class="r">Classes</th></tr></thead><tbody>
      ${Object.values(P.subjects).map(s=>`<tr><td>${esc(s.raw)}</td><td>${s.match?subjMark(s.match.id):`<span class="subj"><i style="background:var(--line-strong)"></i>${esc(s.name)}</span> <span class="kind" style="margin-left:6px">New subject</span>`}</td><td class="r num">${s.count}</td></tr>`).join('')}
    </tbody></table></div>
    <div class="calwrap"><div style="min-width:${52+[...new Set(P.classes.map(c=>c.dow))].length*96}px">${timeGrid({cols:WEEK.filter(d=>P.classes.some(c=>c.dow===d)).map(d=>({head:`<b>${DOW[d]}</b>`,items:P.classes.filter(c=>c.dow===d).map((c,i)=>({key:'pv|'+i,s:c.s,e:c.e,color:(P.subjects[c.subject.toLowerCase()].match||{}).color||'var(--slate)',cls:'class',label:c.room||'',title:P.subjects[c.subject.toLowerCase()].name,sub:`${fromMin(c.s)}–${fromMin(c.e)}`}))})),H0:Math.floor(Math.min(...P.classes.map(c=>c.s))/60),H1:Math.ceil(Math.max(...P.classes.map(c=>c.e))/60),HH:40,minW:96,inert:true})}</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;padding:14px 0">${S.classes.length?`<button class="btn" data-act="pv-apply" data-m="replace">Replace my timetable</button><button class="btn sec2" data-act="pv-apply" data-m="add">Add to my timetable</button>`:`<button class="btn" data-act="pv-apply" data-m="replace">Use this timetable</button>`}<button class="btn ghost" data-act="pv-cancel">Discard</button></div>
  </section>`:''}

  <section class="sec">
    <div class="sh"><h2>Your week</h2><span class="aside" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span>Shaded = free time · tap any block for details</span>
      <span class="seg" role="group" aria-label="Show">${[['1','Classes and study'],['0','Classes only']].map(([k,l])=>`<button type="button" data-act="ttplan" data-v="${k}" class="${(ui.ttPlan!==false)===(k==='1')?'on':''}">${l}</button>`).join('')}</span></span></div>
    ${sel}${detailPanel()}
    <div class="calwrap" id="calwrap">${timeGrid({cols,H0:R.H0,H1:R.H1,HH:52,minW:118})}</div>
    <details style="margin-top:12px" ${S.classes.length?'':'open'}><summary style="cursor:pointer;font-size:13px;color:var(--link)">Add a class by hand</summary>
    <form class="form cls" id="clsForm" autocomplete="off">
      <label class="field f-title"><span>Subject</span><select class="in" id="cf-sub">${S.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label>
      <div class="field f-days"><span>Days</span>${dayPicker('cls',ui.pick.cls)}</div>
      <label class="field"><span>Start</span><input class="in num" type="time" id="cf-s" required value="08:00"></label>
      <label class="field"><span>End</span><input class="in num" type="time" id="cf-e" required value="08:45"></label>
      <label class="field"><span>Room</span><input class="in" id="cf-room" placeholder="Optional"></label>
      <div class="acts"><button class="btn" type="submit">Add class</button></div>
    </form><div id="clsMsg" class="ok"></div></details>
    ${S.classes.length?`<div style="padding:10px 0 0">${ui.confirm==='clear-classes'?'<button class="btn danger sm" data-act="do-clear-classes">Confirm: remove all classes</button> <button class="btn sec2 sm" data-act="confirm" data-c="">Cancel</button>':'<button class="btn ghost sm" style="padding:0" data-act="confirm" data-c="clear-classes">Remove all classes</button>'}</div>`:''}
  </section>

  ${holidaysSection()}

  <section class="sec">
    <div class="sh"><h2>How your free time is worked out</h2>${ui.flash==='hours'?'<span class="ok">Saved. Free time and the plan have been updated.</span>':''}</div>
    <form id="hoursForm" class="hours-rules" autocomplete="off">
      <p>On school days, study time starts when your last class ends, plus <input class="in num inl" type="number" id="hr-travel" min="0" max="180" step="5" value="${st.travel}"> min to get home.</p>
      <p>On days without classes, start at <input class="in num inl" type="time" id="hr-start" value="${st.dayStart}">, with lunch at <input class="in num inl" type="time" id="hr-lunch" value="${st.lunch}">.</p>
      <p>Stop studying by <input class="in num inl" type="time" id="hr-end" value="${st.dayEnd}">. Dinner at <input class="in num inl" type="time" id="hr-dinner" value="${st.dinner}"> for <input class="in num inl" type="number" id="hr-dmin" min="0" max="120" step="5" value="${st.dinnerMin}"> min.</p>
      <p class="muted" style="font-size:12.5px">Events you add to the calendar, and tests, are taken out of free time on their day.</p>
      <div><button class="btn" type="submit">Save</button></div>
    </form>
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
    <td class="num hide-sm">${pr.filter(b=>b.done).length} / ${pr.length} done<small class="muted" style="display:block;font-size:11.5px">From ${fmtDate(iso(addDays(parse(t.date),-prepDaysFor(t))))} · ${prepDaysFor(t)} days · ${fmtH(pr.reduce((a,b)=>a+b.min,0))}</small></td>
    <td style="min-width:160px"><div style="display:flex;gap:10px;align-items:center"><input class="range" type="range" min="0" max="100" step="5" value="${t.prep}" data-prep="${t.id}" aria-label="How prepared"><span class="num muted" style="width:34px;text-align:right" id="pp-${t.id}">${t.prep}%</span></div></td>
    <td class="r"><span class="rowact"><button class="icon" data-act="del-test" data-id="${t.id}" aria-label="Delete">${ic('del')}</button></span></td></tr>`};
  return `<div class="phead"><div><h1>Tests</h1><div class="sub">Prep starts ${STYPES.science[1]} days ahead for sciences and maths, ${STYPES.humanities[1]} for humanities and ${STYPES.language[1]} for languages, with 50% longer for exams. Sessions get longer as the test gets closer. Change the lead time for each subject in Settings.</div></div>
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
function gridRange(){
  const starts=S.classes.map(c=>toMin(c.start));
  const H0=Math.max(5,Math.min(7,Math.floor((starts.length?Math.min(...starts):8*60)/60)));
  const H1=Math.min(24,Math.max(22,Math.ceil(toMin(S.settings.dayEnd)/60)+1));
  return{H0,H1};
}
function layoutCol(items,H0,H1){
  const ev=items.map(e=>({...e,s2:Math.max(e.s,H0*60),e2:Math.min(e.e,H1*60)})).filter(e=>e.e2>e.s2).sort((a,b)=>a.s2-b.s2||b.e2-a.e2);
  let cluster=[],cEnd=-1;const out=[];
  const flush=()=>{const lanes=[];for(const e of cluster){let i=lanes.findIndex(end=>end<=e.s2);if(i<0){i=lanes.length;lanes.push(0)}lanes[i]=e.e2;e.lane=i}cluster.forEach(e=>{e.n=lanes.length;out.push(e)});cluster=[]};
  for(const e of ev){if(e.s2>=cEnd&&cluster.length)flush();cluster.push(e);cEnd=Math.max(cEnd,e.e2)}
  if(cluster.length)flush();return out;
}
/* cols: [{head, today, slot(iso), allDay:[{title,color}], shade:[[a,b]], items:[{key,s,e,color,cls,label,title,sub}]}] */
function timeGrid({cols,H0,H1,HH,minW,wide,inert}){
  const n=cols.length,nm=nowHM();
  let g=`<div class="cal ${wide?'wide':''}" style="--hh:${HH}px;grid-template-columns:52px repeat(${n},minmax(${minW}px,1fr));min-width:${52+n*minW}px">`;
  g+=`<div class="corner"></div>`+cols.map(c=>`<div class="dh ${c.today?'today':''}">${c.head}</div>`).join('');
  if(cols.some(c=>c.allDay&&c.allDay.length))g+=`<div class="corner2">All day</div>`+cols.map(c=>`<div class="ad">${(c.allDay||[]).map(a=>`<button type="button" class="adi" data-act="sel-ev" data-key="${esc(a.key||'')}" style="border-left-color:${a.color}">${esc(a.title)}</button>`).join('')}</div>`).join('');
  g+=`<div class="hours">${[...Array(H1-H0)].map((_,i)=>`<div class="num">${i?pad(H0+i)+':00':''}</div>`).join('')}</div>`;
  for(const c of cols){
    g+=`<div class="day ${c.today?'today':''} ${c.slot?'slot':''}" style="height:${(H1-H0)*HH}px" ${c.slot?`data-slot="${c.slot}" data-h0="${H0}" data-hh="${HH}" title="Click an empty time to add an event"`:''}>`;
    for(const[a,b] of c.shade||[]){const s=Math.max(a,H0*60),e=Math.min(b,H1*60);if(e>s)g+=`<div class="freebg" style="top:${(s-H0*60)/60*HH}px;height:${(e-s)/60*HH}px"></div>`}
    for(const e of layoutCol(c.items||[],H0,H1)){
      const top=(e.s2-H0*60)/60*HH,h=Math.max(16,(e.e2-e.s2)/60*HH-2),w=100/e.n;
      g+=`<${inert?'div':'button type="button"'} class="ev ${e.cls||''} ${ui.selEvent===e.key?'sel':''}" style="--c:${e.color};top:${top}px;height:${h}px;left:calc(${e.lane*w}% + 2px);width:calc(${w}% - 4px)" ${inert?'':`data-act="sel-ev" data-key="${esc(e.key)}"`} title="${esc(e.title)} ${esc(e.sub||'')}">
        ${h>=34&&e.label?`<span class="k">${esc(e.label)}</span>`:''}<b>${esc(e.title)}</b>${h>=(wide?30:50)&&e.sub?`<small class="num">${esc(e.sub)}</small>`:''}</${inert?'div':'button'}>`;
    }
    if(c.today&&nm>=H0*60&&nm<=H1*60)g+=`<div class="nowline" style="top:${(nm-H0*60)/60*HH}px"></div>`;
    g+=`</div>`;
  }
  return g+'</div>';
}
function evColor(e){if(e.src==='plan')return planColor(e);return e.kind==='test'?'var(--red)':e.kind==='personal'?'var(--personal)':e.subject?sub(e.subject).color:'var(--school)'}
function dayCol(day,opts={}){
  const T=TD(),x=parse(day);
  const items=[];
  for(const e of fixedOn(day)){if(e.allDay)continue;items.push({key:`${e.src}|${e.id}|${day}`,s:toMin(e.start),e:toMin(e.end),color:evColor(e),cls:e.kind,label:KINDS[e.kind],title:e.title,sub:`${e.start}–${e.end}${e.room?' · '+e.room:''}`})}
  for(const b of blocksOn(day))items.push({key:`plan|${b.key}|${day}`,s:toMin(b.start),e:toMin(b.end),color:planColor(b),cls:'plan'+(b.done?' done':''),label:PLANL[b.kind],title:b.title,sub:`${b.start}–${b.end}`});
  const allDay=fixedOn(day).filter(e=>e.allDay).map(e=>({key:`${e.src}|${e.id}|${day}`,title:e.title,color:e.kind==='holiday'?'var(--gold)':e.kind==='away'?'var(--red)':'var(--school)'}));
  return{head:opts.head||`<b>${DOW[x.getDay()]}</b><span class="num">${x.getDate()}</span>`,today:day===T,slot:day,allDay,shade:availOn(day),items};
}
function detailPanel(){
  if(!ui.selEvent||/^tt/.test(ui.selEvent))return '';
  const[src,id,day]=ui.selEvent.split('|');const P=plan();
  const e=src==='plan'?P.blocks.find(b=>b.key===id):fixedOn(day).find(x=>x.id===id&&x.src===src);
  if(!e)return '';
  const lbl=src==='plan'?PLANL[e.kind]:KINDS[e.kind];
  let acts='';
  if(src==='plan')acts=e.done?`<button class="btn sec2 sm" data-act="block-undo" data-key="${esc(id)}">Mark not done</button>`:`<button class="btn sm" data-act="focus-block" data-key="${esc(id)}">${ic('play')}Start focus</button><button class="btn sec2 sm" data-act="block-done" data-key="${esc(id)}">Mark done</button>`;
  else if(src==='test')acts='<a class="btn sec2 sm" href="#tests">Edit in Tests</a>';
  else if(src==='holiday')acts='<a class="btn sec2 sm" href="#holidays">Edit holidays</a>';
  else if(src==='class')acts=`<button class="btn sec2 sm" data-act="cancel-class" data-id="${id}" data-day="${day}">Cancelled this day</button><a class="btn sec2 sm" href="#timetable">Edit timetable</a>`;
  else acts=e.dow?`<button class="btn sec2 sm" data-act="skip-ev" data-id="${id}" data-day="${day}">Skip this day only</button><button class="btn danger sm" data-act="del-ev" data-id="${id}">Delete every week</button>`:`<button class="btn danger sm" data-act="del-ev" data-id="${id}">Delete</button>`;
  return `<div class="evdetail"><div><span class="kind ${e.kind}">${lbl}${src==='plan'?' · planned automatically':e.dow?' · every '+DOWL[parse(day).getDay()]:''}</span><h3>${esc(e.title)}</h3>
    <div class="muted num" style="font-size:13px">${fmtDate(day)} · ${e.allDay?'All day':e.start+'–'+e.end}${e.subject?' · '+esc(sub(e.subject).name):''}${e.room?' · '+esc(e.room):''}</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${acts}<button class="btn sec2 sm" data-act="sel-ev" data-key="">Close</button></div></div>`;
}
const EVKINDS=[['personal','Personal (sport, tuition, plans)'],['school','School event'],['holiday','Holiday: no classes'],['away','Away all day']];
function eventForm(){
  const n=ui.newEv;if(!n)return '';
  const allDay=n.kind==='holiday'||n.kind==='away';
  return `<form class="form evf" id="evForm" autocomplete="off">
    <div class="evf-h"><span class="label">New event · ${fmtDate(n.day)}</span><button type="button" class="btn ghost sm" data-act="ev-cancel" style="padding:0">Cancel</button></div>
    <label class="field f-title"><span>What</span><input class="in" id="ef-title" required value="${esc(n.title||'')}" placeholder="${allDay?'e.g. Diwali holiday':'e.g. Badminton, dentist, cousin’s wedding'}"></label>
    <label class="field"><span>Type</span><select class="in" id="ef-kind">${EVKINDS.map(([k,l])=>`<option value="${k}" ${n.kind===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <label class="field"><span>Date</span><input class="in num" type="date" id="ef-day" required value="${n.day}"></label>
    ${allDay?'':`<label class="field"><span>From</span><input class="in num" type="time" id="ef-s" required value="${n.start}"></label>
    <label class="field"><span>To</span><input class="in num" type="time" id="ef-e" required value="${n.end}"></label>
    <label class="field chk"><span>&nbsp;</span><span class="ckl"><input type="checkbox" class="ck" id="ef-rep" ${n.repeat?'checked':''}> Every week</span></label>`}
    <div class="acts"><button class="btn" type="submit">Add event</button></div>
    <p class="muted" style="grid-column:1/-1;margin:0;font-size:12.5px">${n.kind==='holiday'?'Classes are removed that day and the whole day becomes free time.':n.kind==='away'?'No study is planned that day.':'This time is taken out of your free time, and the plan moves around it.'}</p>
  </form>`;
}
function vCalendar(){
  const T=TD(),anchor=ui.calDate||T,day=ui.calView==='day';
  const ws=weekStart(parse(anchor)),we=addDays(ws,6);
  const days=day?[anchor]:[...Array(7)].map((_,i)=>iso(addDays(ws,i)));
  const R=gridRange();
  const a=parse(anchor);
  const title=day?`${DOWL[a.getDay()]} ${a.getDate()} ${MONL[a.getMonth()]}`:(ws.getMonth()===we.getMonth()?`${ws.getDate()}–${we.getDate()} ${MONL[we.getMonth()]} ${we.getFullYear()}`:`${ws.getDate()} ${MON[ws.getMonth()]} – ${we.getDate()} ${MON[we.getMonth()]} ${we.getFullYear()}`);
  const P=plan();
  const planned=P.blocks.filter(b=>b.day>=days[0]&&b.day<=days[days.length-1]);
  const freeM=days.reduce((s,d)=>s+availOn(d).reduce((x,[p,q])=>x+q-p,0),0);
  const cols=days.map(d=>dayCol(d,day?{head:`<b>${DOWL[parse(d).getDay()]}</b><span class="num">${parse(d).getDate()} ${MON[parse(d).getMonth()]}</span>`}:{}));
  let dayList='';
  if(day){const its=cols[0].items.slice().sort((x,y)=>x.s-y.s);
    dayList=`<div class="daylist">${its.length?its.map(i=>`<button type="button" class="lrow" data-act="sel-ev" data-key="${esc(i.key)}" style="grid-template-columns:92px minmax(0,1fr) auto;width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer;font:inherit;color:inherit"><span class="tm num">${fromMin(i.s)}–${fromMin(i.e)}</span><span class="tt">${esc(i.title)}</span><span class="kind ${i.cls.split(' ')[0]}">${esc(i.label||'')}</span></button>`).join(''):'<div class="empty">Nothing on this day.</div>'}</div>`}
  return `<div class="phead"><div><h1>Calendar</h1><div class="sub">Classes, events and your planned study. Shaded time is free. Click any empty time to add an event there.</div></div>
    <dl class="overview num"><div><dt>Study planned</dt><dd>${fmtH(planned.reduce((s,b)=>s+b.min,0))}</dd></div><div><dt>Free time left</dt><dd>${fmtH(freeM)}</dd></div><div><dt>Tests</dt><dd>${S.tests.filter(t=>t.date>=days[0]&&t.date<=days[days.length-1]).length}</dd></div></dl></div>
  <div class="calbar">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div class="seg" role="group" aria-label="View">${[['day','Day'],['week','Week']].map(([k,l])=>`<button type="button" data-act="calview" data-v="${k}" class="${ui.calView===k?'on':''}">${l}</button>`).join('')}</div>
      <div class="nav2"><button class="btn sec2 sm" data-act="calnav" data-d="-1" aria-label="Previous">${ic('l')}</button><button class="btn sec2 sm" data-act="calnav" data-d="0">Today</button><button class="btn sec2 sm" data-act="calnav" data-d="1" aria-label="Next">${ic('r')}</button></div>
      <h2 class="num">${title}</h2>
    </div>
    <button class="btn sm" data-act="ev-new">+ Add event</button>
  </div>
  ${eventForm()}
  ${detailPanel()}
  <div class="${day?'dayview':''}">
    <div class="calwrap" id="calwrap">${timeGrid({cols,H0:R.H0,H1:R.H1,HH:day?52:44,minW:day?0:104,wide:day})}</div>
    ${dayList}
  </div>
  <div class="legend" style="padding:10px 0"><span><i style="border-color:var(--school);background:color-mix(in srgb,var(--school) 13%,var(--surface))"></i>Class</span><span><i style="border-color:var(--blue);background:var(--surface);outline:1px solid color-mix(in srgb,var(--blue) 45%,transparent)"></i>Planned study</span><span><i style="border-color:var(--red);background:color-mix(in srgb,var(--red) 13%,var(--surface))"></i>Test</span><span><i style="border-color:var(--personal);background:color-mix(in srgb,var(--personal) 13%,var(--surface))"></i>Event</span><span><i style="border-color:transparent;background:color-mix(in srgb,var(--blue) 10%,var(--surface))"></i>Free time</span></div>`;
}

/* =========================================================
   Focus timer
   ========================================================= */
const F={block:null,blockKey:null,taskId:null,subject:null,len:45,remaining:45*60000,running:false,endAt:0,seg:0,accrued:0,started:false,msg:null,doneTask:null};
function clockTxt(ms){const s=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}:${pad(m)}:${pad(x)}`:`${pad(m)}:${pad(x)}`}
function focusCtx(){
  const b=F.block||(F.blockKey?plan().blocks.find(x=>x.key===F.blockKey):null);
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
  const frac=Math.max(0,Math.min(1,1-F.remaining/(F.len*60000)));
  document.querySelectorAll('[data-clock]').forEach(x=>x.textContent=clockTxt(F.remaining));
  document.querySelectorAll('[data-cbar]').forEach(x=>x.style.width=(frac*100)+'%');
  const c=$('#clock');if(c){c.textContent=clockTxt(F.remaining);$('#fbar').style.width=((1-F.remaining/(F.len*60000))*100)+'%';$('#fel').textContent=fmtMin(Math.floor((F.len*60000-F.remaining)/60000))+' elapsed'}
}
async function lockWake(){try{wake=await navigator.wakeLock?.request('screen')}catch(e){wake=null}}
function tStart(){if(F.remaining<=0)F.remaining=F.len*60000;if(!F.started&&F.blockKey&&!F.block){const b=plan().blocks.find(x=>x.key===F.blockKey);if(b&&!b.done)F.block={...b}}F.started=true;planVersion++;F.running=true;F.seg=Date.now();F.endAt=Date.now()+F.remaining;F.msg=null;F.doneTask=null;clearInterval(tickT);tickT=setInterval(tick,250);lockWake();render()}
function tPause(){if(!F.running)return;F.remaining=F.endAt-Date.now();F.accrued+=Date.now()-F.seg;F.running=false;clearInterval(tickT);try{wake?.release()}catch(e){}render()}
function finish(completed){
  if(F.running){F.accrued+=Date.now()-F.seg;F.running=false}
  clearInterval(tickT);try{wake?.release()}catch(e){}
  const min=Math.round(F.accrued/60000),{b,t,sid,title}=focusCtx();
  if(min>=1){
    if(b&&!b.done){const bb={...b};F.block=null;F.started=false;markBlock(bb.key,true,min,bb)}
    else{S.log.push({id:uid(),date:TD(),subject:sid||null,min,note:title});touch()}
  }
  F.msg=min>=1?`${completed?'Session complete.':'Session ended.'} ${fmtMin(min)} logged${b?' and the planned session marked done':''}.`:'Session ended. Under a minute, so nothing was logged.';
  F.doneTask=t&&min>=1?t.id:null;
  F.started=false;F.block=null;F.accrued=0;F.blockKey=null;F.remaining=F.len*60000;planVersion++;
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
      ${num('rf-read','Reading per day (min)',st.readMin,0,120)}${num('rf-paper','Past papers per day (min)',st.paperMin,0,120)}${num('rf-prep','Test prep session (min)',st.prepMin,10,180)}
    </div><div class="row">
      ${num('rf-sday','Study per school day (min)',st.studyDay,0,600,15,190)}${num('rf-swe','Study per day off (min)',st.studyWeekend,0,720,15,190)}</div><div class="row">${num('rf-block','Longest homework block (min)',st.maxBlock,15,180,5,190)}${num('rf-hor','Plan ahead (days)',st.horizon,7,42,1)}
      <button class="btn" type="submit">Save rules</button></div>
      <span class="muted" style="font-size:12.5px">Prep sessions in the last two days before a test are 15 minutes longer. Past papers follow the subject of your next test.</span>
      ${ui.flash==='rules'?'<span class="ok">Saved. The plan has been rebuilt.</span>':''}</form></div>
  <div class="set"><div><h2>Subjects</h2><p>Each subject keeps one colour everywhere. The type sets how many days before a test the prep starts, and you can change the number of days.</p></div>
    <div class="body">${S.subjects.map(s=>{const used=S.tasks.some(t=>t.subject===s.id)||S.tests.some(t=>t.subject===s.id)||S.classes.some(t=>t.subject===s.id);return `<div class="row" style="align-items:center">
      <input type="color" class="sw" value="${esc(s.color)}" data-color="${s.id}" aria-label="Colour for ${esc(s.name)}">
      <input class="in" style="flex:1 1 180px;width:auto" value="${esc(s.name)}" data-sname="${s.id}" aria-label="Subject name">
      <select class="in" style="width:150px" data-stype="${s.id}" aria-label="Subject type">${Object.entries(STYPES).map(([k,[l]])=>`<option value="${k}" ${subType(s)===k?'selected':''}>${l}</option>`).join('')}</select>
      <label class="ckl" style="font-size:12.5px;color:var(--slate);display:inline-flex;align-items:center;gap:6px"><input class="in num" type="number" min="1" max="28" style="width:60px" value="${subLead(s)}" data-slead="${s.id}" aria-label="Days of prep">days</label>
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
const ui={taskF:{subject:'all',status:'open',q:''},sort:{key:'due',dir:1},editTask:null,selEvent:null,confirm:null,flash:null,pick:{cls:[1]},
  calView:(window.matchMedia&&matchMedia('(max-width:700px)').matches)?'day':'week',calDate:null,newEv:null,preview:null,impTab:'link',impMsg:'',impBusy:false,impUrl:'',holTab:'paste',holMsg:'',holBusy:false,holPreview:null};
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
  if(location.hash==='#holidays'&&v!==lastView)setTimeout(()=>$('#holidays')?.scrollIntoView({block:'start'}),0);
  lastView=v;ui.flash=null;
  renderRunbar();
}
function renderRunbar(){
  let el=$('#runbar');if(!el){el=document.createElement('div');el.id='runbar';el.setAttribute('role','region');el.setAttribute('aria-label','Running session');document.body.appendChild(el)}
  const show=S&&F.started&&currentView()!=='focus';el.hidden=!show;document.body.classList.toggle('running',!!show);if(!show)return;
  const{title}=focusCtx();const frac=Math.max(0,Math.min(1,1-F.remaining/(F.len*60000)));
  el.innerHTML=`<div class="rb-bar"><span data-cbar style="width:${frac*100}%"></span></div><div class="rb-in"><div class="rb-t"><span class="label">${F.running?'In session':'Paused'}</span><b>${esc(title)}</b></div><span class="rb-c num" data-clock>${clockTxt(F.remaining)}</span><div class="rb-a">${F.running?'<button class="btn sec2 sm" data-act="t-pause">Pause</button>':`<button class="btn sm" data-act="t-resume">${ic('play')}Resume</button>`}<button class="btn sec2 sm" data-act="t-end">Finish</button><a class="btn ghost sm" href="#focus">${ic('full')}</a></div></div>`;
}
function go(v){if(location.hash==='#'+v)render();else location.hash=v}
function startApp(){
  document.body.classList.add('authed');$('#auth').innerHTML='';
  F.len=+S.settings.focusLen||45;F.remaining=F.len*60000;
  planVersion++;lastView=null;render();
}
window.addEventListener('hashchange',()=>{if(!S||/access_token|type=/.test(location.hash))return;ui.selEvent=null;if(currentView()!=='calendar')ui.newEv=null;ui.confirm=null;ui.editTask=null;closeMenu();render()});
function closeMenu(){$('#side').classList.remove('open');$('.scrim').classList.remove('open')}

/* =========================================================
   Events
   ========================================================= */
document.addEventListener('click',e=>{
  const slot=S&&!e.target.closest('.ev,.adi')&&e.target.closest('.day.slot');
  if(slot){const r=slot.getBoundingClientRect();const m=Math.min(23*60,Math.max(0,Math.floor((+slot.dataset.h0*60+(e.clientY-r.top)/(+slot.dataset.hh)*60)/15)*15));
    ui.newEv={day:slot.dataset.slot,start:fromMin(m),end:fromMin(Math.min(m+60,23*60+45)),kind:'personal',title:''};ui.selEvent=null;
    if(currentView()!=='calendar'){ui.calView='day';ui.calDate=slot.dataset.slot;go('calendar')}else render();
    setTimeout(()=>{$('#evForm')?.scrollIntoView({block:'nearest'});$('#ef-title')?.focus()},40);return}
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
    case 'calview':ui.calView=a.dataset.v;ui.selEvent=null;render();break;
    case 'calnav':{const d=+a.dataset.d;ui.calDate=d===0?TD():iso(addDays(parse(ui.calDate||TD()),d*(ui.calView==='day'?1:7)));ui.selEvent=null;render();break}
    case 'cal-open':ui.calView='day';ui.calDate=a.dataset.day;go('calendar');break;
    case 'ev-new':{const d=ui.calView==='day'?(ui.calDate||TD()):((ui.calDate||TD())<=TD()&&iso(addDays(weekStart(parse(ui.calDate||TD())),6))>=TD()?TD():iso(weekStart(parse(ui.calDate||TD()))));ui.newEv={day:d,start:'17:00',end:'18:00',kind:'personal',title:''};ui.selEvent=null;render();setTimeout(()=>$('#ef-title')?.focus(),30);break}
    case 'ev-cancel':ui.newEv=null;render();break;
    case 'skip-ev':{const ev=S.events.find(x=>x.id===id);if(ev){ev.skip=(ev.skip||[]).concat(a.dataset.day)}ui.selEvent=null;touch();render();break}
    case 'cancel-class':{const c=S.classes.find(x=>x.id===id);if(c){c.skip=(c.skip||[]).concat(a.dataset.day)}ui.selEvent=null;touch();render();break}
    case 'del-class-day':{const c=S.classes.find(x=>x.id===id);if(c){c.dow=c.dow.filter(x=>x!==+a.dataset.d);if(!c.dow.length)S.classes=S.classes.filter(x=>x!==c)}ui.selEvent=null;touch();render();break}
    case 'holtab':ui.holTab=a.dataset.t;ui.holMsg='';render();break;
    case 'hol-paste':runHolImport('paste',$('#holPaste').value);break;
    case 'hol-apply':{const n=ui.holPreview.list.length;for(const h of ui.holPreview.list)if(!S.holidays.some(x=>x.start===h.start&&x.end===h.end))S.holidays.push({id:uid(),...h});ui.holPreview=null;touch();ui.holMsg='';render();break}
    case 'hol-cancel':ui.holPreview=null;render();break;
    case 'del-hol':S.holidays=S.holidays.filter(h=>h.id!==id);touch();render();break;
    case 'ttplan':ui.ttPlan=a.dataset.v==='1';ui.selEvent=null;render();break;
    case 'imptab':ui.impTab=a.dataset.t;ui.impMsg='';render();break;
    case 'imp-paste':runImport('paste',$('#clsPaste').value);break;
    case 'pv-apply':applyPreview(a.dataset.m);render();window.scrollTo(0,0);break;
    case 'pv-cancel':ui.preview=null;render();break;
    case 'sel-ev':ui.selEvent=a.dataset.key||null;render();break;
    case 'del-ev':S.events=S.events.filter(x=>x.id!==id);ui.selEvent=null;touch();render();break;
    case 'del-class':S.classes=S.classes.filter(x=>x.id!==id);ui.selEvent=null;touch();render();break;
    case 'do-clear-classes':S.classes=[];ui.confirm=null;touch();render();break;
    case 'pick':{const g=a.dataset.g,d=+a.dataset.d,arr=ui.pick[g];const i=arr.indexOf(d);if(i>=0)arr.splice(i,1);else arr.push(d);a.classList.toggle('on');a.setAttribute('aria-pressed',a.classList.contains('on'));break}
    case 'block-done':markBlock(a.dataset.key,true);ui.selEvent=null;render();break;
    case 'block-undo':markBlock(a.dataset.key,false);ui.selEvent=null;render();break;
    case 'focus-block':focusOnBlock(a.dataset.key);break;
    case 'run-block':{if(F.started)break;const b=plan().blocks.find(x=>x.key===a.dataset.key);if(!b)break;F.block={...b};F.blockKey=b.key;F.taskId=null;F.subject=b.subject;F.len=b.min;F.remaining=b.min*60000;F.accrued=0;F.msg=null;tStart();break}
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
document.addEventListener('change',e=>{
  const el=e.target;if(!S)return;
  if(el.dataset.toggle){const t=S.tasks.find(x=>x.id===el.dataset.toggle);if(t){t.done=el.checked;touch();render()}return}
  if(el.dataset.block){markBlock(el.dataset.block,el.checked);render();return}
  if(el.dataset.rev){const r=S.revision.find(x=>x.id===el.dataset.rev);if(r){r.done=el.checked;touch();render()}return}
  if(el.dataset.prep){const t=S.tests.find(x=>x.id===el.dataset.prep);if(t){t.prep=+el.value;touch()}return}
  if(el.dataset.color){const s=sub(el.dataset.color);s.color=el.value;touch();return}
  if(el.dataset.stype){const x=S.subjects.find(z=>z.id===el.dataset.stype);if(x){x.type=el.value;delete x.prepDays;touch();render()}return}
  if(el.dataset.slead){const x=S.subjects.find(z=>z.id===el.dataset.slead);if(x){x.prepDays=Math.max(1,Math.min(28,Math.round(+el.value||7)));touch()}return}
  if(el.dataset.sname){const s=S.subjects.find(x=>x.id===el.dataset.sname);if(s&&el.value.trim()){s.name=el.value.trim();touch()}return}
  if(el.id==='tsub'){ui.taskF.subject=el.value;$('#tbody').innerHTML=tasksBody();return}
  if(el.id==='fTask'){const[k,v]=el.value.split('|');F.blockKey=null;F.taskId=null;F.subject=null;
    if(k==='b'){const b=plan().blocks.find(x=>x.key===v);if(b){F.blockKey=v;F.subject=b.subject;F.len=b.min;F.remaining=b.min*60000}}
    else if(k==='t')F.taskId=v;else if(k==='s')F.subject=v;F.msg=null;render();return}
  if(el.id==='holFile'){if(el.files&&el.files[0])runHolImport('file',el.files[0]);return}
  if(el.id==='clsFile'){if(el.files&&el.files[0])runImport('file',el.files[0]);return}
  if(el.id==='ef-kind'&&ui.newEv){Object.assign(ui.newEv,{kind:el.value,title:$('#ef-title').value,day:$('#ef-day').value||ui.newEv.day,start:$('#ef-s')?.value||ui.newEv.start,end:$('#ef-e')?.value||ui.newEv.end,repeat:$('#ef-rep')?.checked});render();return}
  if(el.id==='ics-file'){const msg=$('#ics-msg'),kind=$('#ics-kind').value;readFile(el.files&&el.files[0],txt=>{
    const evs=parseICS(txt);let n=0;
    for(const x of evs){const title=x.title||'Untitled';if(x.s.time){const st=x.s.time,en=x.e&&x.e.time&&x.e.day===x.s.day?x.e.time:fromMin(Math.min(toMin(st)+60,23*60+59));S.events.push({id:uid(),title,kind,day:x.s.day,start:st,end:en})}else S.events.push({id:uid(),title,kind,day:x.s.day,allDay:true,start:'00:00',end:'23:59'});n++}
    touch();msg.style.color=n?'':'var(--red)';msg.textContent=n?`Imported ${n} ${n===1?'event':'events'}. They now appear in the calendar.`:'No events found in that file.'});return}
  if(el.id==='bk-file'){const msg=$('#rs-msg');readFile(el.files&&el.files[0],txt=>{try{const o=normalize(JSON.parse(txt));if(!o||!Array.isArray(o.tasks))throw 0;S=o;touch();render();$('#rs-msg').textContent='Planner restored.'}catch(err){msg.style.color='var(--red)';msg.textContent='That file is not a Quire backup.'}});return}
});
function readFile(f,cb){if(!f)return;const r=new FileReader();r.onload=()=>cb(String(r.result));r.readAsText(f)}
document.addEventListener('input',e=>{
  const el=e.target;if(!S)return;
  if(el.id==='ef-title'&&ui.newEv){ui.newEv.title=el.value;return}
  if(el.id==='tq'){ui.taskF.q=el.value;$('#tbody').innerHTML=tasksBody();return}
  if(el.dataset.prep){const p=$('#pp-'+el.dataset.prep);if(p)p.textContent=el.value+'%'}
});
['dragover','dragenter'].forEach(t=>document.addEventListener(t,e=>{const d=e.target.closest&&e.target.closest('#drop');if(d){e.preventDefault();d.classList.add('over')}}));
document.addEventListener('dragleave',e=>{const d=e.target.closest&&e.target.closest('#drop');if(d)d.classList.remove('over')});
document.addEventListener('drop',e=>{const h=e.target.closest&&e.target.closest('#holDrop');if(h){e.preventDefault();if(e.dataTransfer.files[0])runHolImport('file',e.dataTransfer.files[0]);return}const d=e.target.closest&&e.target.closest('#drop');if(!d)return;e.preventDefault();d.classList.remove('over');if(e.dataTransfer.files[0])runImport('file',e.dataTransfer.files[0])});

function timesOk(sId,eId,form){const s=$(sId).value,en=$(eId).value;if(!s||!en||toMin(en)<=toMin(s)){$(eId).setCustomValidity('End must be after start');form.reportValidity();$(eId).setCustomValidity('');return false}return true}
document.addEventListener('submit',e=>{
  const f=e.target;if(f.id==='authForm'||!S)return;e.preventDefault();
  if(f.id==='taskForm'){const v={title:$('#tf-title').value.trim(),subject:$('#tf-sub').value,due:$('#tf-due').value,est:Math.max(5,Math.round(+$('#tf-est').value||30)),priority:$('#tf-pri').value,type:$('#tf-type').value};
    if(!v.title||!v.due){f.reportValidity();return}
    if(ui.editTask){Object.assign(S.tasks.find(t=>t.id===ui.editTask),v);ui.editTask=null}else S.tasks.push({id:uid(),done:false,...v});
    touch();render();$('#tf-title')?.focus()}
  if(f.id==='testForm'){const v={id:uid(),title:$('#xf-title').value.trim(),subject:$('#xf-sub').value,date:$('#xf-date').value,time:$('#xf-time').value||'09:00',dur:Math.max(10,+$('#xf-dur').value||60),prep:Math.min(100,Math.max(0,+$('#xf-prep').value||0))};if(!v.title||!v.date){f.reportValidity();return}S.tests.push(v);touch();render()}
  if(f.id==='evForm'){const kind=$('#ef-kind').value,day=$('#ef-day').value,title=$('#ef-title').value.trim();if(!title||!day){f.reportValidity();return}
    if(kind==='holiday'||kind==='away')S.events.push({id:uid(),title,kind,day,allDay:true,start:'00:00',end:'23:59'});
    else{if(!timesOk('#ef-s','#ef-e',f))return;const ev={id:uid(),title,kind,start:$('#ef-s').value,end:$('#ef-e').value};if($('#ef-rep').checked)ev.dow=[parse(day).getDay()];else ev.day=day;S.events.push(ev)}
    ui.newEv=null;ui.calDate=day;touch();render()}
  if(f.id==='clsForm'){if(!ui.pick.cls.length){$('#clsMsg').style.color='var(--red)';$('#clsMsg').textContent='Choose at least one day.';return}if(!timesOk('#cf-s','#cf-e',f))return;
    const s=$('#cf-s').value,en=$('#cf-e').value;S.classes.push({id:uid(),subject:$('#cf-sub').value,dow:[...ui.pick.cls],start:s,end:en,room:$('#cf-room').value.trim()});
    touch();render();const ns=$('#cf-s'),ne=$('#cf-e');if(ns){ns.value=en;ne.value=fromMin(toMin(en)+(toMin(en)-toMin(s)))}}
  if(f.id==='hoursForm'){const st=S.settings;st.travel=Math.max(0,Math.min(180,Math.round(+$('#hr-travel').value||0)));st.dayStart=$('#hr-start').value||'09:30';st.lunch=$('#hr-lunch').value||'13:00';st.dayEnd=$('#hr-end').value||'21:30';st.dinner=$('#hr-dinner').value||'20:00';st.dinnerMin=Math.max(0,Math.min(120,Math.round(+$('#hr-dmin').value||0)));st.hoursSet=true;touch();ui.flash='hours';render()}
  if(f.id==='holLink'){runHolImport('link',$('#hol-url').value.trim())}
  if(f.id==='holForm'){const a=$('#hf-s').value,b=$('#hf-e').value||a;if(!a){f.reportValidity();return}S.holidays.push({id:uid(),name:$('#hf-name').value.trim()||'School holiday',start:a<=b?a:b,end:a<=b?b:a});touch();render()}
  if(f.id==='impLink'){ui.impUrl=$('#imp-url').value.trim();runImport('link',ui.impUrl)}
  if(f.id==='profForm'){S.settings.name=$('#sf-name').value.trim();S.settings.goal=Math.max(1,+$('#sf-goal').value||14);S.settings.focusLen=Math.max(5,+$('#sf-len').value||45);
    if(!F.started){F.len=S.settings.focusLen;F.remaining=F.len*60000}touch();ui.flash='prof';render()}
  if(f.id==='ruleForm'){const st=S.settings,n=(id,lo,hi,d)=>Math.min(hi,Math.max(lo,Math.round(+$(id).value)))||d;
    st.readMin=Math.min(120,Math.max(0,Math.round(+$('#rf-read').value||0)));st.paperMin=Math.min(120,Math.max(0,Math.round(+$('#rf-paper').value||0)));
    st.prepMin=n('#rf-prep',10,180,30);st.studyDay=Math.min(600,Math.max(0,Math.round(+$('#rf-sday').value||0)));st.studyWeekend=Math.min(720,Math.max(0,Math.round(+$('#rf-swe').value||0)));st.maxBlock=n('#rf-block',15,180,45);st.horizon=n('#rf-hor',7,42,21);
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
