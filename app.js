'use strict';
const subjects={sej:'Sejarah',bio:'Biologi',fiz:'Fizik',kim:'Kimia',mat:'Matematik',add:'Matematik Tambahan'};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=document.getElementById('app'),letters='ABCDE',all={},chapters={};
const read=(key,def)=>{try{return JSON.parse(localStorage.getItem(key))??def}catch{return def}};
let records=read('rn-progress-v1',{}),session=read('rn-session-v1',null),storageOK=true;
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{storageOK=false}}
for(const [s,list] of Object.entries(CONTENT)) for(const ch of list){
 ch.subject=s;ch.key=[s,ch.form,ch.bab].join('-');chapters[ch.key]=ch;
 ch.ids=ch.questions.map((q,i)=>{const id=ch.key+'-'+i;all[id]={...q,id,ch};return id});
}
const chapterList=Object.values(chapters);
const route=()=>location.hash.slice(1).split('/');
const go=path=>{if(location.hash==='#'+path)render();else location.hash=path};
const filtered=(s,f)=>chapterList.filter(c=>(!s||c.subject===s)&&(!Number(f)||c.form===Number(f)));
const wrongIds=()=>Object.keys(records).filter(id=>all[id]&&!records[id].right);
const btn=(text,path,primary=false,ic='')=>'<a class="btn '+(primary?'primary':'')+'" href="#'+path+'">'+(ic?icon(ic,16):'')+esc(text)+'</a>';
const back=(label,path)=>'<a class="back" href="#'+path+'">'+icon('back',15)+esc(label)+'</a>';
function tabs(form,path){return '<div class="tabs" aria-label="Tapis tingkatan">'+[['0','Semua'],['4','Ting. 4'],['5','Ting. 5']].map(([n,l])=>'<button class="'+(form===n?'active':'')+'" aria-pressed="'+(form===n)+'" data-go="'+path+'/'+n+'">'+l+'</button>').join('')+'</div>'}
const countCh=(ch)=>ch.ids.filter(id=>records[id]).length+' dijawab · '+ch.ids.filter(id=>records[id]?.right).length+' betul';
function dashboard(mode='home',f='0'){
 const home=mode==='home',list=filtered('',f),page=home?'Subjek anda':'Pilih subjek',title=home?'Ruang belajar anda':mode==='nota'?'Nota bab':'Latihan subjek';
 const desc=home?'Pilih subjek untuk baca nota dan uji kefahaman anda.':mode==='nota'?'Buka nota mengikut subjek, tingkatan dan bab.':'Pilih bab atau cuba latihan campuran.';
 return '<section class="hero"><div><span class="eyebrow">'+icon('cap',18)+' Studio SPM</span><h1>'+title+'</h1><p>'+desc+'</p><div class="chips"><span class="chip">'+icon('book',14)+' 6 subjek</span><span class="chip">'+icon('layers',14)+' Tingkatan 4 &amp; 5</span></div></div><img src="hero.svg" alt=""></section><div class="sectionHeader"><h2>'+page+'</h2>'+tabs(f,mode)+'</div><div class="cards">'+Object.entries(subjects).map(([s,name])=>{let cs=list.filter(c=>c.subject===s);return '<a class="card '+s+'" href="#sub/'+s+'/'+f+'/'+mode+'"><div class="artband">'+subjectArt(s)+'</div><div class="cardInfo"><div><h3>'+name+'</h3><span class="meta">'+cs.length+' bab · '+cs.reduce((n,c)=>n+c.ids.length,0)+' soalan</span></div><span class="circle">'+icon('chev',14)+'</span></div></a>'}).join('')+'</div>';
}
function subject(s,f,mode){
 const cs=filtered(s,f), path='sub/'+s+'/'+f+'/'+mode;
 return back('Semua subjek',mode+'/'+f)+'<section class="sectionHero '+s+'"><div><div class="eyebrow">Studio SPM</div><h1 class="pageTitle">'+subjects[s]+'</h1><p class="subtext">'+cs.length+' bab · '+cs.reduce((n,c)=>n+c.ids.length,0)+' soalan</p></div>'+subjectArt(s)+'</section><div class="sectionHeader"><h2>'+(mode==='nota'?'Nota bab':mode==='latihan'?'Latihan bab':'Pilih bab')+'</h2><div class="tabs">'+[['0','Semua'],['4','Ting. 4'],['5','Ting. 5']].map(([n,l])=>'<button aria-pressed="'+(f===n)+'" class="'+(f===n?'active':'')+'" data-go="sub/'+s+'/'+n+'/'+mode+'">'+l+'</button>').join('')+'</div></div>'+(mode==='nota'?'':'<button class="btn primary" data-mix="'+s+'/'+f+'/'+mode+'">'+icon('shuffle',17)+' Latihan campuran · 10 soalan</button>')+[4,5].filter(t=>cs.some(c=>c.form===t)).map(t=>'<section class="formBlock"><h3>Tingkatan '+t+'</h3>'+cs.filter(c=>c.form===t).map(c=>'<div class="row"><div><div class="smallLabel">Bab '+c.bab+'</div><div class="rowTitle">'+esc(c.title)+'</div><div class="meta">'+countCh(c)+'</div></div><div class="rowBtns">'+(mode==='latihan'?'':btn('Nota','read/'+c.key+'/'+f+'/'+mode,false,'book'))+(mode==='nota'?'':'<button class="btn" data-start="'+c.key+'/'+f+'/'+mode+'">'+icon('quiz',15)+' Latihan</button>')+'</div></div>').join('')+'</section>').join('');
}
function notes(c,f,mode){
 const listed=new Set();
 const jump=c.notes.map(([title],index)=>{
  const key=title.match(/^\d+\.\d+/)?.[0]||title;
  if(listed.has(key))return '';
  listed.add(key);
  return '<option value="'+index+'">'+esc(title)+'</option>';
 }).join('');
 const articles=c.notes.map(([title,ms,zh,enTitle,en],index)=>{
  const language=(code,label,heading,body)=>'<section lang="'+code+'"><span class="noteLanguage">'+label+'</span><h3>'+esc(heading)+'</h3><p>'+esc(body)+'</p></section>';
  return '<article id="topic-'+index+'" class="note" tabindex="-1"><div class="'+(c.subject==='sej'?'singleNote':'parallelNotes')+'">'+language('ms','Bahasa Melayu',title,ms)+(c.subject==='sej'?'':language('en','English',enTitle,en))+'</div><p lang="zh" class="zh">'+esc(zh)+'</p></article>';
 }).join('');
 return '<div class="reading">'+back(subjects[c.subject],'sub/'+c.subject+'/'+f+'/'+mode)+'<div class="eyebrow">Tingkatan '+c.form+' · Bab '+c.bab+'</div><h1>'+esc(c.title)+'</h1><label class="topicPicker">Pilih subtopik<select id="topic-select"><option value="">Semua subtopik</option>'+jump+'</select></label><div class="panel">'+articles+'</div><div class="details"><a class="source" href="'+esc(c.source)+'" target="_blank" rel="noopener">Buku teks '+subjects[c.subject]+' Tingkatan '+c.form+'</a><button class="btn primary" data-start="'+c.key+'/'+f+'/'+mode+'">'+icon('quiz',16)+' Cuba latihan bab</button></div></div>';
}
app.addEventListener('change',event=>{
 if(event.target.id!=='topic-select')return;
 const target=document.getElementById('topic-'+event.target.value);
 if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'start'})}
 else window.scrollTo(0,0);
});
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const persist=()=>save('rn-session-v1',session);
function begin(ids,title,origin){if(!ids.length)return;session={ids,title,origin,step:0,selected:null,results:[],order:[],finished:false};prepare();go('kuiz')}
function prepare(){session.order=shuffle([0,1,2,3,4]);session.selected=null;persist()}
function quiz(){
 if(!session?.ids?.length||session.ids.some(id=>!all[id]))return dashboard('latihan');
 const {ids,title,origin,step,selected,order,results}=session,head='<div class="reading">'+back('Kembali',origin);
 if(session.finished){const score=results.filter(x=>x.correct).length;return head+'<div class="panel empty">'+icon('target',32)+'<h1>Latihan selesai</h1><div class="score">'+score+' / '+ids.length+'</div><p>'+esc(title)+' · Jawapan betul</p><div class="actions" style="justify-content:center">'+btn('Pilih bab',origin,true)+(wrongIds().length?btn('Buku kesilapan','salah'):'')+'</div></div></div>'}
 const q=all[ids[step]],c=q.ch,done=!!results[step],picked=done?results[step].picked:selected;
 const pair=q.options[q.answer];
 return head+'<div class="progressline"><strong>'+esc(title)+'</strong><span class="meta">Soalan '+(step+1)+' / '+ids.length+'</span></div><div class="track"><i style="width:'+((step+Number(done))*100/ids.length)+'%"></i></div><div class="smallLabel">'+subjects[c.subject]+' · Tingkatan '+c.form+' · Bab '+c.bab+' · '+esc(q.section)+'</div><div class="panel"><h1 class="qtitle">'+esc(q.ms)+'</h1><p class="translation" lang="en">'+esc(q.en)+'</p><div class="opts">'+order.map((idx,i)=>{let [m,e]=q.options[idx],state=done?(idx===q.answer?'correct':idx===picked?'wrong':''):idx===picked?'selected':'';return '<button class="opt '+state+'" data-choice="'+idx+'" aria-pressed="'+(idx===picked)+'" '+(done?'disabled':'')+'><b>'+letters[i]+'</b><span>'+esc(m)+(m===e?'':'<small lang="en">'+esc(e)+'</small>')+'</span>'+(done&&idx===q.answer?icon('check',18):'')+'</button>'}).join('')+'</div>'+(done?'<div class="feedback" role="status"><strong>'+(picked===q.answer?'Betul · Correct':'Kurang tepat · Incorrect')+'</strong><p>Jawapan / Answer: '+letters[order.indexOf(q.answer)]+'. '+esc(pair[0])+(pair[0]===pair[1]?'':' / '+esc(pair[1]))+'</p><p lang="zh">'+esc(q.zh)+'</p></div><button class="btn primary" data-next>'+(step+1===ids.length?'Lihat keputusan':'Soalan seterusnya')+'</button>':'<button class="btn primary" data-submit '+(selected===null?'disabled':'')+'>Semak jawapan</button>')+'</div></div>'
}
function wrong(){
 const ids=wrongIds();return '<div class="sectionHero"><div><div class="eyebrow">Ulang kaji</div><h1 class="pageTitle">Buku kesilapan</h1><p class="subtext">'+ids.length+' soalan untuk dicuba semula.</p></div>'+icon('retry',38)+'</div>'+(ids.length?'<div class="sectionHeader"><h2>Soalan anda</h2><button class="btn primary" data-retry="all">Ulang semua</button></div>'+ids.map(id=>{let q=all[id];return '<div class="row reviewList"><div><span class="smallLabel">'+subjects[q.ch.subject]+' · Tingkatan '+q.ch.form+' · Bab '+q.ch.bab+'</span><p>'+esc(q.ms)+'</p><div class="meta" lang="en">'+esc(q.en)+'</div></div><button class="btn" data-retry="'+id+'">Cuba semula</button></div>'}).join(''):'<div class="panel empty">'+icon('book',35)+'<h2>Belum ada kesilapan</h2><p>Soalan yang dijawab salah akan muncul di sini untuk latihan semula.</p>'+btn('Pilih latihan','latihan/0',true)+'</div>')}
function render(){
 const [r='',a,b='0',d='home']=route(),safeForm=v=>['4','5'].includes(v)?v:'0',mode=['home','nota','latihan'].includes(d)?d:'home';
 let active=['salah','latihan','nota'].includes(r)?r:'home';
 if(r==='sub'||r==='read')active=mode;if(r==='kuiz')active=session?.origin==='salah'?'salah':'latihan';
 document.querySelector('#nav').innerHTML=[['home','home','Utama'],['nota','book','Nota'],['latihan','quiz','Latihan'],['salah','retry','Buku kesilapan']].map(([p,i,l])=>'<a class="'+(active===p?'active':'')+'" '+(active===p?'aria-current="page"':'')+' href="#'+p+'">'+icon(i,16)+l+'</a>').join('');
 app.innerHTML=(storageOK?'':'<div class="notice">Kemajuan sesi ini hanya disimpan sementara pada pelayar ini.</div>')+(r==='sub'&&Object.hasOwn(subjects,a)?subject(a,safeForm(b),mode):r==='read'&&Object.hasOwn(chapters,a)?notes(chapters[a],safeForm(b),mode):r==='kuiz'?quiz():r==='salah'?wrong():dashboard(['nota','latihan'].includes(r)?r:'home',safeForm(a)));
 if(r==='latihan'||r==='salah')app.insertAdjacentHTML('beforeend','<details class="panel"><summary>Tetapkan semula latihan / Reset progress</summary><p>Padam semua rekod jawapan, kesilapan dan sesi semasa pada pelayar ini?</p><p lang="en">Clear all answers, mistakes and the current quiz on this browser?</p><button class="btn" data-cancel-reset>Batal / Cancel</button> <button class="btn primary" data-reset>Ya, tetapkan semula / Reset all</button></details><p id="reset-status" role="status"></p>');
}
app.addEventListener('click',ev=>{
 const el=ev.target.closest('button');if(!el||el.disabled)return;
 const x=el.dataset;if(x.go){go(x.go);return}
 if(x.start||x.mix){const [id,f,mode]=(x.start||x.mix).split('/');if(x.start){const c=chapters[id];begin(shuffle(c.ids),subjects[c.subject]+' · Bab '+c.bab,'sub/'+c.subject+'/'+f+'/'+mode)}else{begin(shuffle(filtered(id,f).flatMap(c=>c.ids)).slice(0,10),subjects[id]+' · Campuran','sub/'+id+'/'+f+'/'+mode)}return}
 if(x.retry){begin(x.retry==='all'?shuffle(wrongIds()):[x.retry],'Ulang kesilapan','salah');return}
 if('cancelReset' in x){el.closest('details').open=false;return}
 if('reset' in x){records={};session=null;save('rn-progress-v1',records);persist();render();document.getElementById('reset-status').textContent=storageOK?'Kemajuan telah ditetapkan semula. / Progress reset.':'Progress cleared for this visit.';return}
 if(!session)return;
 if('choice' in x&&!session.results[session.step]){session.selected=Number(x.choice);persist();render();app.querySelector('[data-choice="'+x.choice+'"]')?.focus({preventScroll:true});return}
 if('submit' in x&&session.selected!==null&&!session.results[session.step]){let q=all[session.ids[session.step]],correct=session.selected===q.answer;session.results.push({picked:session.selected,correct});records=read('rn-progress-v1',records);records[q.id]={right:correct};save('rn-progress-v1',records);persist();render();app.querySelector('[data-next]')?.focus({preventScroll:true});return}
 if('next' in x&&session.results[session.step]){if(session.step+1===session.ids.length){session.finished=true;persist()}else{session.step++;prepare()}render();window.scrollTo(0,0)}
});
addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});addEventListener('storage',e=>{if(e.key==='rn-session-v1'&&e.newValue==='null'){session=null;render()}if(e.key==='rn-progress-v1'){records=read(e.key,{});render()}});render();
