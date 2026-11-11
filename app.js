'use strict';
(() => {
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const {photos,videos} = window.MEDIA;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const categories = ['山野远行','城市漫游','青春同频','我的切片'];
const range = (n,a,b) => n>=a && n<=b;
const city = new Set([28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,99,100,101,102,103,106,107,108,113,130,162,165,166,183,184,185]);
const friends = new Set([71,72,75,76,77,79,80,81,82,83,84,85,87,88,89,90,95,109,116,117,132,133,134,135,136,137,139,164,168,170,172,174,177,180,181,182,186,188,189,190]);
photos.forEach(p=>{const n=p.index;p.category=(range(n,43,65)||range(n,140,161)||n===163)?categories[0]:city.has(n)?categories[1]:(n<=26||range(n,66,70)||range(n,111,129)||friends.has(n)||n===169||n===191)?categories[2]:categories[3];});
videos.forEach(v=>{v.category=[2,5].includes(v.index)?categories[0]:[8,12].includes(v.index)?categories[1]:categories[2];});
let all=[...photos,...videos].sort((a,b)=>categories.indexOf(a.category)-categories.indexOf(b.category)||a.type.localeCompare(b.type)||a.index-b.index);
const byId = new Map(all.map(m=>[m.id,m]));
$('#photo-count').textContent=photos.length;$('#video-count').textContent=videos.length;
['#nav-count','#total-count','#cosmos-count'].forEach(s=>$(s).textContent=all.length);
$('#film-count').textContent=videos.length;$('#year').textContent=new Date().getFullYear();
const filters=$('.filters');
filters.innerHTML=[['all','全部',all.length],['photo','照片',photos.length],['video','视频',videos.length],...categories.map(c=>[c,c,all.filter(m=>m.category===c).length])].map(([key,label,count],i)=>`<button data-filter="${key}" class="${i===0?'active':''}" aria-pressed="${i===0}">${label}<span>${count}</span></button>`).join('');
let currentFilter='all';
let visible=all;
function renderArchive(){
 visible=all.filter(m=>currentFilter==='all'||m.type===currentFilter||m.category===currentFilter);
 $('#archive-grid').innerHTML=visible.map(m=>`<button class="media-card" data-id="${m.id}" style="--ratio:${m.width?m.width+'/'+m.height:'3/4'}" aria-label="打开${m.category}，${m.label}${m.type==='video'?'，视频':''}"><img src="${m.thumb}" alt="${m.category} · ${m.label}" width="${m.width||480}" height="${m.height||640}" loading="lazy" decoding="async">${m.type==='video'?'<span class="video-badge">▶ '+time(m.duration)+'</span>':''}<span class="category-tag">${m.category}</span><span class="media-info"><span>${m.label}</span><span>↗</span></span></button>`).join('');
}
filters.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;currentFilter=b.dataset.filter;$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderArchive();});
$('#archive-grid').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b)openViewer(b.dataset.id,visible);});
$('#density').onclick=()=>{$('#archive-grid').classList.toggle('dense');};
$('#shuffle').onclick=()=>{for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]];}renderArchive();toast('记忆已打乱，重新发现你的世界。');};
function time(s){return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;}
$('#films').innerHTML=videos.map(v=>`<button class="film-card" data-id="${v.id}" aria-label="播放${v.label}，${time(v.duration)}"><div class="film-thumb"><img src="${v.thumb}" alt="${v.label}的视频封面" loading="lazy"><span class="play">▶</span><span class="duration">${time(v.duration)}</span></div><div class="film-label">${v.label}<span>PLAY ↗</span></div></button>`).join('');
const featured=videos[16]||videos[0];
$('#cinema-feature').innerHTML=`<button data-id="${featured.id}" aria-label="播放精选舞台视频"><img src="${featured.thumb}" alt="舞台上的演出瞬间" loading="lazy"><span class="film-spot">NOW SHOWING / 特别放映</span><span class="play-big">▶</span><div class="feature-caption"><strong>这一刻，我在场。</strong><small>ORIGINAL SOUND / ${time(featured.duration)}</small></div></button>`;
for(const s of ['#films','#cinema-feature'])$(s).addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b)openViewer(b.dataset.id,videos);});
$('#film-prev').onclick=()=>$('#films').scrollBy({left:-460,behavior:reduced?'instant':'smooth'});
$('#film-next').onclick=()=>$('#films').scrollBy({left:460,behavior:reduced?'instant':'smooth'});
$$('[data-photo]').forEach(b=>b.onclick=()=>openViewer(photos[+b.dataset.photo].id,photos));
$('#random').onclick=()=>openViewer(all[Math.floor(Math.random()*all.length)].id,all);
renderArchive();
// Fullscreen viewer, with one shared media element at a time.
const viewer=$('#viewer');let viewList=all,viewIndex=0,slideTimer=null,sliding=false,previousFocus=null;
function openViewer(id,list=all){viewList=list;viewIndex=Math.max(0,list.findIndex(m=>m.id===id));if(!viewer.open){previousFocus=document.activeElement;viewer.showModal();document.body.classList.add('locked');}showItem();}
function showItem(){
 clearTimeout(slideTimer);const m=viewList[viewIndex];if(!m)return;
 const old=$('#viewer-content video');if(old){old.pause();old.removeAttribute('src');old.load();}
 $('#viewer-title').textContent=m.category+' / '+m.label;$('#viewer-type').textContent=m.type==='photo'?'STILL FRAME':'MOTION PICTURE';
 $('#viewer-counter').textContent=`${String(viewIndex+1).padStart(3,'0')} / ${String(viewList.length).padStart(3,'0')}`;
 $('#viewer-name').textContent=m.name;$('#download').href=m.src;$('#download').download=m.name.replace(/\.jpg$/i,'.webp');
 const content=$('#viewer-content');content.replaceChildren();
 if(m.type==='photo'){const im=new Image();im.src=m.src;im.alt=m.category+' · '+m.label;content.append(im);if(sliding)slideTimer=setTimeout(()=>step(1),4500);}
 else{const v=document.createElement('video');v.src=m.src;v.poster=m.thumb;v.controls=true;v.playsInline=true;v.preload='metadata';content.append(v);v.play().catch(()=>{});v.addEventListener('ended',()=>{if(sliding)step(1);});v.addEventListener('error',()=>toast('视频暂未载入，请检查网络后重试。'));}
}
function step(d){viewIndex=(viewIndex+d+viewList.length)%viewList.length;showItem();}
function stopSlides(){sliding=false;clearTimeout(slideTimer);$('#slideshow').classList.remove('playing');$('#slideshow').textContent='自动放映 ▷';$('#slideshow').setAttribute('aria-label','开始自动放映');}
function closeViewer(){stopSlides();const v=$('#viewer-content video');if(v){v.pause();v.removeAttribute('src');v.load();}$('#viewer-content').replaceChildren();viewer.close();if(!expanded)document.body.classList.remove('locked');previousFocus?.focus({preventScroll:true});}
$('#viewer-close').onclick=closeViewer;$('#viewer-prev').onclick=()=>step(-1);$('#viewer-next').onclick=()=>step(1);
viewer.addEventListener('cancel',e=>{e.preventDefault();closeViewer();});
$('#slideshow').onclick=()=>{if(sliding){stopSlides();return;}sliding=true;$('#slideshow').classList.add('playing');$('#slideshow').textContent='暂停放映 Ⅱ';$('#slideshow').setAttribute('aria-label','暂停自动放映');if(viewList[viewIndex].type==='photo')slideTimer=setTimeout(()=>step(1),4500);toast('自动放映已开启');};
document.addEventListener('keydown',e=>{if(viewer.open){if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}}else if(e.key==='Escape'&&expanded)toggleExpanded();});
let swipe=null;$('#viewer-content').addEventListener('touchstart',e=>{if(e.target.tagName==='VIDEO')return;swipe=[e.touches[0].clientX,e.touches[0].clientY];},{passive:true});
$('#viewer-content').addEventListener('touchend',e=>{if(!swipe)return;const dx=e.changedTouches[0].clientX-swipe[0],dy=e.changedTouches[0].clientY-swipe[1];if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)step(dx>0?-1:1);swipe=null;},{passive:true});
let toastTimer;function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2800);}
const io=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('visible');io.unobserve(en.target);}}),{threshold:.08});$$('.reveal').forEach(x=>io.observe(x));
function scrollProgress(){const max=document.documentElement.scrollHeight-innerHeight;$('#progress').style.width=(max?scrollY/max*100:0)+'%';}
addEventListener('scroll',scrollProgress,{passive:true});
// A real interactive globe: all 213 user assets have an individual point.
const canvas=$('#cosmos'),ctx=canvas.getContext('2d'),wrap=$('#cosmos-wrap');
let cw=0,ch=0,dpr=1,angle=.25,tilt=-.12,zoom=1,auto=!reduced,dragging=false,active=false,expanded=false,raf=0,dragLast=null,dragStart=null,hover=-1,projected=[],lastT=0;
const sphereItems=[...photos,...videos];
const points=sphereItems.map((m,i)=>{const y=1-(i/(sphereItems.length-1))*2,r=Math.sqrt(1-y*y),phi=i*Math.PI*(3-Math.sqrt(5));return {x:Math.cos(phi)*r,y,z:Math.sin(phi)*r,m,img:null};});
const stars=Array.from({length:100},(_,i)=>({x:(Math.sin(i*127.1)*43758.5453)%1,y:(Math.sin(i*311.7)*9382.7)%1,a:.1+(i%5)*.07}));
function resize(){const r=canvas.getBoundingClientRect();cw=r.width;ch=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(active&&!raf)raf=requestAnimationFrame(draw);}
new ResizeObserver(resize).observe(wrap);
let loadIndex=0;function loadNext(){if(loadIndex>=points.length)return;const p=points[loadIndex++];const im=new Image();im.onload=()=>{p.img=im;loadNext();};im.onerror=loadNext;im.src=p.m.thumb;}
let started=false;new IntersectionObserver(([e])=>{active=e.isIntersecting;if(active){if(!started){started=true;for(let i=0;i<6;i++)loadNext();}lastT=0;if(!raf)raf=requestAnimationFrame(draw);}},{threshold:.02}).observe(wrap);
function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function draw(t){
 raf=0;if(!active||document.hidden||viewer.open){if(active)raf=requestAnimationFrame(draw);return;}
 const dt=lastT?Math.min((t-lastT)/16.67,3):1;lastT=t;if(auto&&!dragging)angle+=.0014*dt;
 ctx.clearRect(0,0,cw,ch);stars.forEach(s=>{ctx.fillStyle=`rgba(238,220,225,${s.a})`;ctx.fillRect(Math.abs(s.x)*cw,Math.abs(s.y)*ch,1,1);});
 const radius=Math.min(cw*.39,ch*.40)*zoom, cy=ch*.46, ca=Math.cos(angle),sa=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
 projected=points.map((p,i)=>{let x=p.x*ca+p.z*sa,z=-p.x*sa+p.z*ca,y=p.y*ct-z*st;z=p.y*st+z*ct;const scale=2.4/(2.4-z*.72),size=(cw<600?26:39)*scale*zoom;return {i,x:cw/2+x*radius*scale,y:cy+y*radius*scale,z,size,scale,p};}).sort((a,b)=>a.z-b.z);
 // A few delicate connections give the globe a constellation structure.
 ctx.strokeStyle='#f044481c';ctx.lineWidth=.6;for(let i=0;i<projected.length-4;i+=7){const a=projected[i],b=projected[i+4];if(Math.hypot(a.x-b.x,a.y-b.y)<radius*.32){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
 for(const q of projected){const {p,x,y,z,size,i}=q;const ratio=p.img?p.img.width/p.img.height:.8;const w=ratio>1?size*1.32:size*.85,h=ratio>1?size*.9:size*1.13;q.w=w;q.h=h;ctx.globalAlpha=.23+(z+1)*.36;
  if(p.img){ctx.save();if(i===hover){ctx.globalAlpha=1;ctx.shadowBlur=20;ctx.shadowColor='#f04448';}roundedRect(x-w/2-1,y-h/2-1,w+2,h+2,1);ctx.fillStyle=i===hover?'#f04448':'#c6ada955';ctx.fill();ctx.shadowBlur=0;ctx.drawImage(p.img,x-w/2,y-h/2,w,h);if(p.m.type==='video'){ctx.fillStyle='white';ctx.font=`${Math.max(7,size*.2)}px Arial`;ctx.fillText('▶',x-w/2+3,y+h/2-3);}ctx.restore();}
  else{ctx.fillStyle='#de5b64';ctx.fillRect(x-1,y-1,2,2);}
 }
 ctx.globalAlpha=1;if(active)raf=requestAnimationFrame(draw);
}
function pointerPos(e){const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
canvas.addEventListener('pointerdown',e=>{if(!e.isPrimary)return;dragging=true;dragLast=pointerPos(e);dragStart=dragLast;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{const p=pointerPos(e);if(dragging&&dragLast){angle+=(p[0]-dragLast[0])*.006;tilt=Math.max(-1.2,Math.min(1.2,tilt+(p[1]-dragLast[1])*.006));dragLast=p;}else{hover=hit(p)?.i??-1;canvas.style.cursor=hover>=0?'pointer':'grab';}});
function hit(p){return [...projected].reverse().find(q=>q.p.img&&Math.abs(p[0]-q.x)<q.w/2+4&&Math.abs(p[1]-q.y)<q.h/2+4);}
canvas.addEventListener('pointerup',e=>{if(!dragging)return;const p=pointerPos(e);if(dragStart&&Math.hypot(p[0]-dragStart[0],p[1]-dragStart[1])<9){const q=hit(p);if(q)openViewer(q.p.m.id,sphereItems);}dragging=false;dragLast=null;dragStart=null;});
canvas.addEventListener('pointercancel',()=>{dragging=false;dragLast=null;dragStart=null;});
canvas.addEventListener('wheel',e=>{if(expanded){e.preventDefault();zoom=Math.max(.65,Math.min(1.8,zoom-e.deltaY*.001));}},{passive:false});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')tilt-=.12;if(e.key==='ArrowDown')tilt+=.12;if(e.key==='Enter')openViewer(sphereItems[Math.floor(Math.random()*sphereItems.length)].id,sphereItems);});
$('#cosmos-motion').setAttribute('aria-pressed',String(auto));$('#cosmos-motion').textContent=auto?'暂停旋转 Ⅱ':'继续旋转 ▷';
$('#cosmos-motion').onclick=()=>{auto=!auto;$('#cosmos-motion').textContent=auto?'暂停旋转 Ⅱ':'继续旋转 ▷';$('#cosmos-motion').setAttribute('aria-pressed',String(auto));};
function toggleExpanded(){expanded=!expanded;wrap.classList.toggle('universe-expanded',expanded);document.body.classList.toggle('locked',expanded);$('#cosmos-full').textContent=expanded?'退出全屏 ×':'全屏探索 ⤢';$('#cosmos-full').setAttribute('aria-label',expanded?'退出全屏':'全屏探索影像宇宙');resize();}
$('#cosmos-full').onclick=toggleExpanded;
document.addEventListener('visibilitychange',()=>{lastT=0;});
})();
