const $=(s,r=document)=>r.querySelector(s),KEY='tadkir:v1',MAIL='haithamafkir1@gmail.com';
const API='https://api.alquran.cloud/v1/';
const dflt=()=>({v:1,theme:'light',size:28,bm:[],last:null,kh:null,cnt:{},fav:[],ch:{},skip:{},lvl:'easy'});
let S;try{S={...dflt(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{S=dflt()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch{alert('تعذر الحفظ: مساحة التخزين ممتلئة أو معطلة')}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function h(t,a={},...k){const e=document.createElement(t);for(const[x,v]of Object.entries(a)){if(x.startsWith('on'))e.addEventListener(x.slice(2),v);else if(x==='class')e.className=v;else e.setAttribute(x,v)}
 k.flat().forEach(c=>e.append(c instanceof Node?c:document.createTextNode(c??'')));return e}
const card=(...k)=>h('div',{class:'card'},...k);
const bar=p=>h('div',{class:'bar',role:'progressbar','aria-valuenow':Math.round(p)},h('i',{style:`width:${p}%`}));
// ---- IndexedDB (Quran offline) ----
const idb=()=>new Promise((ok,no)=>{const r=indexedDB.open('tadkir-quran',1);r.onupgradeneeded=()=>r.result.createObjectStore('s',{keyPath:'n'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const tx=async(m,f)=>{const d=await idb();return new Promise((ok,no)=>{const t=d.transaction('s',m),q=f(t.objectStore('s'));t.oncomplete=()=>ok(q.result);t.onerror=()=>no(t.error)})};
const dbGet=n=>tx('readonly',s=>s.get(n)),dbPut=o=>tx('readwrite',s=>s.put(o)),dbKeys=()=>tx('readonly',s=>s.getAllKeys()),dbClear=()=>tx('readwrite',s=>s.clear());
async function api(p){const r=await fetch(API+p);if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(j.code!==200||!j.data)throw Error('استجابة غير صالحة');return j.data}
let LIST=null;
async function surahs(){if(LIST)return LIST;try{const c=localStorage.getItem('tadkir:list');if(c)LIST=JSON.parse(c)}catch{}
 if(!LIST){const d=await api('surah');if(!Array.isArray(d)||d.length!==114)throw Error('قائمة السور غير مكتملة');LIST=d.map(x=>({n:x.number,name:x.name,en:x.englishName,c:x.numberOfAyahs}));try{localStorage.setItem('tadkir:list',JSON.stringify(LIST))}catch{}}return LIST}
const okAyahs=(d,c)=>d&&Array.isArray(d.ayahs)&&d.ayahs.length===c&&d.ayahs.every(a=>typeof a.text==='string'&&a.text&&Number.isInteger(a.numberInSurah));
// ---- Views ----
const V={};
V.home=()=>{const t=today(),dn=S.ch[t],k=S.kh,pr=k?Math.min(100,k.done/604*100):0;
 return[h('h2',{},'السلام عليكم'),h('p',{class:'m'},new Date().toLocaleDateString('ar',{weekday:'long',year:'numeric',month:'long',day:'numeric'})),
 card(h('h3',{},'تحدي اليوم'),h('p',{},dn?'أنجزتَ تحدي اليوم. بارك الله فيك.':'لم تُنجز تحدي اليوم بعد.'),h('a',{class:'btn',href:'#challenges'},'افتح التحدي')),
 card(h('h3',{},'القرآن'),S.last?h('a',{class:'btn',href:`#quran/${S.last.s}`},`تابع القراءة: سورة رقم ${S.last.s}، آية ${S.last.a}`):h('p',{class:'m'},'لم تبدأ القراءة بعد.'),h('a',{class:'btn alt',href:'#quran'},'السور')),
 card(h('h3',{},'الختمة'),k?[h('p',{},`أنجزت ${k.done} من 604 صفحة`),bar(pr)]:h('p',{class:'m'},'لا توجد خطة نشطة.'),h('a',{class:'btn alt',href:'#khatmah'},'الخطة')),
 card(h('h3',{},'الأذكار'),h('a',{class:'btn',href:'#adhkar'},'الأذكار')),
 card(h('h3',{},'عدد التحديات المنجزة'),h('p',{},String(Object.keys(S.ch).length)))]};
V.quran=async(p)=>{const w=h('div');
 if(p){const n=+p;w.append(h('p',{class:'m'},'جارٍ التحميل…'));try{const L=await surahs(),m=L[n-1];if(!m)throw Error('سورة غير موجودة');
  let d=await dbGet(n).catch(()=>null),src='محفوظة على الجهاز';
  if(!d){try{const x=await api(`surah/${n}/quran-uthmani`);if(!okAyahs(x,m.c))throw Error('بيانات ناقصة');d={n,ayahs:x.ayahs.map(a=>({i:a.numberInSurah,t:a.text,pg:a.page}))};src='من الإنترنت'}catch(e){throw Error('تعذر جلب السورة. حمّلها للقراءة دون إنترنت عند توفر الاتصال. ('+e.message+')')}}
  else if(!d.ayahs)throw Error('بيانات محلية تالفة، احذفها من الإعدادات وأعد التحميل');
  w.replaceChildren(h('h2',{},m.name),h('p',{class:'m'},`المصدر: ${src} — alquran.cloud (النص العثماني)`));
  const q=h('div',{class:'q',style:`--qs:${S.size}px`});d.ayahs.forEach(a=>{const sp=h('span',{class:S.bm.some(b=>b.s===n&&b.a===a.i)?'bm':'',title:'اضغط للحفظ كعلامة'},a.t,h('b',{},`﴿${a.i}﴾`));
   sp.onclick=()=>{S.last={s:n,a:a.i};const j=S.bm.findIndex(b=>b.s===n&&b.a===a.i);j>=0?S.bm.splice(j,1):S.bm.push({s:n,a:a.i});sp.classList.toggle('bm');save()};q.append(sp,' ')});
  w.append(q,h('p',{class:'m'},'اضغط على آية لإضافة/إزالة علامة؛ آخر آية تضغطها تُحفظ كموضع القراءة.'),
   n>1?h('a',{class:'btn alt',href:`#quran/${n-1}`},'السابقة'):'',n<114?h('a',{class:'btn',href:`#quran/${n+1}`},'التالية'):'');
  if(!S.last||S.last.s!==n){S.last={s:n,a:1};save()}
 }catch(e){w.replaceChildren(card(h('p',{},'⚠ '+e.message),h('button',{onclick:()=>render()},'إعادة المحاولة')))}return w}
 w.append(h('h2',{},'القرآن الكريم'),h('p',{class:'m'},'جارٍ التحميل…'));
 try{const L=await surahs(),off=new Set(await dbKeys().catch(()=>[]));
  const f=h('input',{type:'search',placeholder:'ابحث عن سورة',oninput:()=>g.querySelectorAll('a').forEach(a=>a.hidden=!a.textContent.includes(f.value))});
  const g=h('div',{class:'grid'});L.forEach(s=>g.append(h('a',{class:'btn alt',href:`#quran/${s.n}`},`${s.n}. ${s.name}`,off.has(s.n)?' ✓':'')));
  w.replaceChildren(h('h2',{},'القرآن الكريم'),h('p',{class:'m'},`✓ = متوفرة دون إنترنت (${off.size}/114). النص من alquran.cloud.`),f,g,h('p',{},h('a',{href:'#settings'},'تحميل القرآن للقراءة دون إنترنت')),
   S.bm.length?card(h('h3',{},'العلامات'),S.bm.map(b=>h('a',{class:'btn alt',href:`#quran/${b.s}`},`سورة ${b.s} آية ${b.a}`))):'')
 }catch(e){w.replaceChildren(h('h2',{},'القرآن الكريم'),card(h('p',{},'⚠ تعذر تحميل قائمة السور: '+e.message+'. تحتاج اتصالاً في أول مرة.'),h('button',{onclick:()=>render()},'إعادة المحاولة')))}return w};
V.khatmah=()=>{const k=S.kh,w=h('div',{},h('h2',{},'خطة الختمة'),h('p',{class:'m'},'وحدة القياس: صفحات المصحف (604 صفحة). أنت من يؤكد ما قرأته.'));
 if(!k){const d=h('input',{type:'number',min:1,max:365,value:30,'aria-label':'عدد الأيام'}),s=h('input',{type:'date',value:today(),'aria-label':'تاريخ البدء'});
  w.append(card(h('label',{},'مدة الختمة (أيام)',d),h('label',{},'تاريخ البدء',s),h('button',{onclick:()=>{const n=+d.value;if(!(n>=1&&n<=365))return alert('أدخل مدة بين 1 و365');S.kh={days:n,start:s.value||today(),done:0,paused:false};save();render()}},'ابدأ الخطة')))}
 else{const per=Math.ceil(604/k.days),pr=k.done/604*100;
  w.append(card(h('p',{},`الورد اليومي: ${per} صفحة`),h('p',{},`المنجز: ${k.done} — المتبقي: ${604-k.done}`),bar(pr),h('p',{},`${pr.toFixed(1)}%`),k.paused?h('p',{class:'m'},'الخطة متوقفة مؤقتًا'):'',
   h('button',{onclick:()=>{k.done=Math.min(604,k.done+per);save();render()}},`أكدت قراءة ${per} صفحة`),h('button',{class:'alt',onclick:()=>{k.done=Math.max(0,k.done-per);save();render()}},'تراجع'),
   h('button',{class:'alt',onclick:()=>{k.paused=!k.paused;save();render()}},k.paused?'استئناف':'إيقاف مؤقت'),
   h('button',{class:'alt',onclick:()=>{const n=+prompt('عدد أيام جديد',k.days);if(n>=1&&n<=365){k.days=n;save();render()}}},'تعديل المدة'),
   h('button',{class:'alt',onclick:()=>{if(confirm('حذف الخطة؟')){S.kh=null;save();render()}}},'إعادة البدء')))}return w};
const AD=[
 {c:'الصباح والمساء',t:'سُبْحَانَ اللهِ وَبِحَمْدِهِ',n:100,r:'صحيح مسلم 2692'},
 {c:'الصباح والمساء',t:'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',n:3,r:'صحيح مسلم 2709 (يُقال مساءً)'},
 {c:'الصباح والمساء',t:'بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',n:3,r:'أبو داود 5088، الترمذي 3388'},
 {c:'بعد الصلاة',t:'سُبْحَانَ اللهِ',n:33,r:'صحيح مسلم 597'},{c:'بعد الصلاة',t:'الْحَمْدُ لِلهِ',n:33,r:'صحيح مسلم 597'},{c:'بعد الصلاة',t:'اللهُ أَكْبَرُ',n:34,r:'صحيح مسلم 597 (تمام المئة)'},
 {c:'النوم',t:'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',n:1,r:'صحيح البخاري 6324'},
 {c:'الاستيقاظ',t:'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',n:1,r:'صحيح البخاري 6312'}];
V.adhkar=(p)=>{const cats=[...new Set(AD.map(a=>a.c))],cat=cats[+p]??null,w=h('div',{},h('h2',{},'الأذكار'),h('p',{class:'m'},'مجموعة مختارة محلية تعمل دون إنترنت. راجع كتب الأذكار الموثوقة للمزيد.'));
 if(cat===null){cats.forEach((c,i)=>w.append(h('a',{class:'btn',href:`#adhkar/${i}`},c)));return w}
 const L=AD.map((a,i)=>({...a,i})).filter(a=>a.c===cat);let x=0;const box=card();
 const draw=()=>{const a=L[x],k='a'+a.i+today(),v=S.cnt[k]||0;box.replaceChildren(h('h3',{},cat+` (${x+1}/${L.length})`),h('p',{class:'q',style:'--qs:26px'},a.t),h('p',{class:'m'},`المرجع: ${a.r} — العدد: ${a.n}`),
  h('div',{class:'cnt'},`${v} / ${a.n}`),bar(Math.min(100,v/a.n*100)),
  h('button',{onclick:()=>{S.cnt[k]=v+1;save();draw()}},'سبّح (+1)'),h('button',{class:'alt',onclick:()=>{S.cnt[k]=0;save();draw()}},'تصفير'),
  h('button',{class:'alt',onclick:()=>{S.fav=S.fav.includes(a.i)?S.fav.filter(z=>z!==a.i):[...S.fav,a.i];save();draw()}},S.fav.includes(a.i)?'★ مفضّل':'☆ إضافة للمفضلة'),
  h('div',{},h('button',{class:'alt',onclick:()=>{x=(x+L.length-1)%L.length;draw()}},'السابق'),h('button',{class:'alt',onclick:()=>{x=(x+1)%L.length;draw()}},'التالي')))};
 draw();w.append(box,h('a',{href:'#adhkar'},'كل التصنيفات'));return w};
const CH={easy:['اقرأ صفحة واحدة من القرآن','قل «سبحان الله وبحمده» مئة مرة','ابتسم في وجه شخص وسلّم عليه','ادعُ لوالديك أو لأحد أحبائك'],
 mid:['اتصل بقريب واطمئن عليه','ساعد أحدًا في أمر صغير','اقرأ أذكار الصباح أو المساء كاملة','تصدّق بما تيسّر إن أمكنك (اختياري تمامًا)'],
 hard:['اقرأ خمس صفحات من القرآن بتدبّر','زر مريضًا أو اتصل به','تعلّم درسًا نافعًا من مصدر موثوق','أصلح بين اثنين أو أعن محتاجًا']};
V.challenges=()=>{const t=today(),L=CH[S.lvl],seed=[...t].reduce((a,c)=>a+c.charCodeAt(0),0)+(S.skip[t]||0),c=L[seed%L.length],done=S.ch[t];
 const sel=h('select',{'aria-label':'الصعوبة',onchange:()=>{S.lvl=sel.value;save();render()}},[['easy','سهل'],['mid','متوسط'],['hard','متقدم']].map(([v,l])=>h('option',{value:v,...(v===S.lvl?{selected:''}:{})},l)));
 return h('div',{},h('h2',{},'تحدي اليوم'),h('p',{class:'m'},'الاقتراحات من مجموعة محلية منتقاة، وليست ذكاءً اصطناعيًا. لا إجبار ولا قضاء للأيام الفائتة.'),sel,
  card(h('h3',{},c),done?h('p',{},'ما شاء الله، أنجزتَ تحدي اليوم 🌿'):[h('button',{onclick:()=>{S.ch[t]=c;save();render()}},'أنجزته'),h('button',{class:'alt',onclick:()=>{S.skip[t]=(S.skip[t]||0)+1;save();render()}},'استبدال')]),
  card(h('h3',{},'السجل'),Object.entries(S.ch).sort().reverse().slice(0,20).map(([d,x])=>h('p',{class:'m'},`${d}: ${x}`)),Object.keys(S.ch).length?'':h('p',{class:'m'},'لا يوجد سجل بعد.')))};
V.contact=()=>{const n=h('input',{placeholder:'اسمك (اختياري)',maxlength:60}),m=h('textarea',{rows:6,placeholder:'رسالتك',maxlength:2000,required:''}),e=h('p',{class:'m',role:'alert'});
 return h('div',{},h('h2',{},'تواصل معنا'),card(h('p',{},'يسعدنا تواصل زوار الموقع: اقتراح أو ملاحظة أو إبلاغ عن خطأ.'),h('p',{},'البريد: ',h('a',{href:'mailto:'+MAIL},MAIL)),
  n,m,e,h('button',{onclick:()=>{const t=m.value.trim();if(t.length<5){e.textContent='اكتب رسالة من 5 أحرف على الأقل';return}
   if(!navigator.onLine){e.textContent='أنت غير متصل. يمكنك كتابة الرسالة وإرسالها عند عودة الاتصال، أو انسخ البريد.';return}
   location.href=`mailto:${MAIL}?subject=${encodeURIComponent('رسالة من تطبيق تذكير')}&body=${encodeURIComponent((n.value?n.value.trim()+'\n\n':'')+t)}`}},'إرسال عبر البريد'),
  h('button',{class:'alt',onclick:async()=>{try{await navigator.clipboard.writeText(MAIL);e.textContent='تم نسخ البريد'}catch{e.textContent=MAIL}}},'نسخ البريد'),
  h('p',{class:'m'},'الزر يفتح تطبيق البريد لديك؛ لا يوجد خادم، ولا تُرسل رسالتك إلى أي جهة غير بريدك أنت.')))};
V.settings=async()=>{const w=h('div',{},h('h2',{},'الإعدادات')),st=h('p',{class:'m'});
 const th=h('button',{onclick:()=>{S.theme=S.theme==='dark'?'light':'dark';save();apply();}},'تبديل الوضع الليلي'),
 sz=h('input',{type:'range',min:20,max:48,value:S.size,'aria-label':'حجم الخط',oninput:()=>{S.size=+sz.value;save()}});
 const dl=h('button',{onclick:async()=>{dl.disabled=true;try{const L=await surahs();let c=0;for(const s of L){if(await dbGet(s.n).catch(()=>0)){c++;continue}
   const x=await api(`surah/${s.n}/quran-uthmani`);if(!okAyahs(x,s.c))throw Error('سورة غير مكتملة: '+s.name);await dbPut({n:s.n,ayahs:x.ayahs.map(a=>({i:a.numberInSurah,t:a.text,pg:a.page}))});st.textContent=`تم ${++c} / 114`}
   st.textContent='اكتمل التحميل بعد التحقق من عدد الآيات ✓'}catch(e){st.textContent='توقف التحميل: '+e.message+' — أعد المحاولة، ما حُمّل يبقى محفوظًا.'}dl.disabled=false}},'تحميل القرآن كاملًا (~1 ميغابايت)');
 const ex=h('button',{class:'alt',onclick:()=>{const a=h('a',{href:URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'})),download:'tadkir-backup.json'});a.click()}},'تصدير بياناتي'),
 im=h('input',{type:'file',accept:'.json','aria-label':'استيراد',onchange:async()=>{try{const o=JSON.parse(await im.files[0].text());if(typeof o!=='object'||o.v!==1)throw 0;S={...dflt(),...o};save();apply();alert('تم الاستيراد')}catch{alert('ملف غير صالح')}}});
 w.append(card(h('h3',{},'المظهر'),th,h('label',{},'حجم نص القرآن',sz)),card(h('h3',{},'القرآن دون إنترنت'),dl,h('button',{class:'alt',onclick:async()=>{if(confirm('حذف القرآن المحمّل؟')){await dbClear();st.textContent='تم الحذف'}}},'حذف المحمّل'),st),
  card(h('h3',{},'بياناتي'),ex,im,h('button',{class:'alt',onclick:()=>{if(confirm('مسح كل بياناتك؟')){localStorage.removeItem(KEY);S=dflt();apply();render()}}},'مسح كل البيانات'),h('p',{class:'m'},'كل بياناتك على جهازك فقط، ولا حساب ولا مزامنة.')),
  card(h('h3',{},'تثبيت التطبيق'),h('p',{class:'m'},'Chrome (أندرويد): القائمة ⋮ ← «تثبيت التطبيق». Safari: مشاركة ← «إضافة إلى الشاشة الرئيسية». هذا تطبيق ويب وليس ودجت أندرويد أصلي.')));return w};
// ---- Router ----
const NAV=[['home','الرئيسية'],['quran','القرآن'],['khatmah','الختمة'],['adhkar','الأذكار'],['challenges','التحدي'],['contact','تواصل'],['settings','الإعدادات']];
function apply(){document.documentElement.dataset.theme=S.theme}
async function render(){const[r,p]=(location.hash.slice(1)||'home').split('/'),v=V[r]||V.home;const m=$('#app');
 $('#nav').replaceChildren(...NAV.map(([k,l])=>h('a',{href:'#'+k,...(k===r?{'aria-current':'page'}:{})},l)));
 const el=await v(p);m.replaceChildren(el);m.focus();scrollTo(0,0)}
addEventListener('hashchange',render);
const net=()=>$('#net').textContent=navigator.onLine?'':'غير متصل';addEventListener('online',net);addEventListener('offline',net);
apply();net();render();
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
