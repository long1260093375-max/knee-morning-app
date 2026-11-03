const V={
 warm:{bv:'BV1df8yz1ETM',t:'MIZI 活力唤醒 6分钟全身热身｜无跳跃'},
 wall:{bv:'BV1YP41137k1',t:'樂樂健身 5分钟靠墙静蹲跟练'},
 bridge:{bv:'BV1kL411J7Zk',t:'帕梅拉 10分钟泵感臀桥｜无深蹲跳跃'},
 side:{bv:'BV1tw411C75X',t:'20分钟臀中肌强化跟练'},
 slr:{bv:'BV1emhB6CENf',t:'坐位直腿抬高跟练（股四头肌）'},
 calf:{bv:'BV1iy2rB4EkK',t:'提踵训练跟练'},
 stretch:{bv:'BV1pUbQzkEje',t:'MIZI 10分钟全身站立拉伸'},
 walk:{bv:'BV1RP8iznE7c',t:'MIZI 燃脂健走 30分钟｜无跳跃无深蹲'},
 follow:{bv:'BV1GS4y197g2',t:'MIZI 30分钟膝盖友好全身有氧｜有音乐可跟练'},
 followWalk:{bv:'BV1RP8iznE7c',t:'MIZI 燃脂健走 30分钟｜有音乐可跟练'},
 ellipse:{bv:'BV1G9ABewE19',t:'15分钟椭圆机跟练'},
 weekendSwim:{bv:'BV1TPkrY6Eg4',t:'15分钟游泳陆地训练跟练'}
};
const S=q=>({q});
const WARM=[
 {n:'踝关节转圈',rx:'每侧顺/逆各 10 圈',tp:'扶墙站稳，脚尖点地慢慢画圈，唤醒脚踝',v:'warm'},
 {n:'慢速抬腿',rx:'每侧 10 次',tp:'原地慢慢抬膝到舒服高度，别甩腿',v:'warm'},
 {n:'髋部画圈',rx:'顺/逆各 10 圈',tp:'双手叉腰，骨盆画大圈，膝盖放松微屈',v:'warm'},
 {n:'站姿微蹲',rx:'10 次（浅幅度）',tp:'只蹲一点点，膝盖对准脚尖不内扣，不痛为准',v:'warm'}];
const STR=[
 {n:'靠墙静蹲（浅蹲）',rx:'20–30 秒 × 3 组',tp:'背贴墙，膝盖角度大于 120° 起步，膝不超脚尖、不内扣；前侧痛就再站高点',v:'wall'},
 {n:'臀桥',rx:'12 次 × 3 组',tp:'脚跟发力、夹紧屁股，抬到肩-髋-膝一条线即可，别塌腰',v:'bridge'},
 {n:'侧卧抬腿',rx:'每侧 12 次 × 2–3 组',tp:'身体成一直线，脚尖微朝前/下，慢抬慢放，感觉屁股侧面发力',v:'side'},
 {n:'坐姿直腿抬高',rx:'每侧 10 次 × 3 组',tp:'先绷紧大腿前侧把膝盖伸直再抬，抬起停 2 秒慢放，腰别拱',v:'slr'},
 {n:'提踵',rx:'15 次 × 2 组',tp:'扶墙或椅背，慢慢踮脚到最高停 1 秒，再慢慢放下',v:'calf'},
 {n:'拉伸：大腿前/后侧、小腿',rx:'各 30 秒',tp:'温和拉到有牵拉感就停，不弹振、正常呼吸',v:'stretch'}];
const CARDIO=[
 {n:'平地快走',rx:'20–30 分钟',tp:'强度：能说话但唱不了歌。选平路，避开连续爬楼、长下坡',v:'walk'},
 {n:'或：固定自行车 / 椭圆机',rx:'20–30 分钟',tp:'座椅调到踩到底膝盖微弯；阻力轻一点，同样能说话不能唱歌',v:'ellipse'},
 {n:'拉伸：大腿前/后侧、小腿',rx:'各 30 秒',tp:'走完趁热拉一拉',v:'stretch'}];
const WEEKEND=[
 {n:'完全休息日 或 轻活动日',rx:'二选一：一天全休，另一天轻活动',tp:'今天想动就：游泳 或 慢散步 30 分钟。不跑不跳～',v:'weekendSwim'},
 {n:'慢散步',rx:'30 分钟',tp:'晒晒太阳，放松走',v:'walk'}];
const DAYS=['日','一','二','三','四','五','六'];
function plan(d){if(d==0||d==6)return{t:'周末放松日 🌿',sub:'休息也是训练的一部分',sec:[['今天',WEEKEND]]};
 if(d%2==1)return{t:'力量稳定日 💪',sub:'约 35 分钟 · 慢慢来，稳稳的',sec:[['① 热身 5 分钟',WARM],['② 力量稳定 约 30 分钟',STR]],follow:'follow'};
 return{t:'轻松有氧日 🚶',sub:'约 35 分钟 · 能说话不能唱歌',sec:[['① 热身 5 分钟',WARM],['② 有氧 20–30 分钟',CARDIO]],follow:'followWalk'};}
const key=d=>d.toISOString().slice(0,10);const today=new Date();let sel=today.getDay();
const L=JSON.parse(localStorage.getItem('kneeLog')||'{}');const save=()=>localStorage.setItem('kneeLog',JSON.stringify(L));
const tk=key(new Date(today.getTime()-today.getTimezoneOffset()*6e4));L[tk]=L[tk]||{};
const $=id=>document.getElementById(id);
function render(){const p=plan(sel);const h=today.getHours();
 $('hi').textContent=(h<11?'早上好呀 ☀️':h<18?'下午好 🌤':'晚上好 🌙')+' · 周'+DAYS[today.getDay()];
 $('title').textContent=(sel==today.getDay()?'今天：':'周'+DAYS[sel]+'：')+p.t;$('sub').textContent=p.sub;
 $('days').innerHTML=[1,2,3,4,5,6,0].map(i=>`<button data-d="${i}" class="${i==sel?'sel':''}">${DAYS[i]}</button>`).join('');
 const st=L[tk].steps||{};let html='',k=0;
 p.sec.forEach(([title,list])=>{html+=`<div class="sec">${title}</div>`;list.forEach(e=>{k++;const id=sel+'-'+k;
  html+=`<div class="card ex"><div class="n">${k}</div><div class="b"><div class="nm">${e.n}</div><div class="rx">${e.rx}</div><div class="tp">${e.tp}</div></div>
  <div style="display:flex;flex-direction:column;gap:8px;align-items:center">${e.v?`<button class="vbtn" data-v="${e.v}">▶ 视频</button>`:`<button class="vbtn s" data-s="${e.s}">🔍 B站搜</button>`}
  ${sel==today.getDay()?`<input type="checkbox" data-k="${id}" ${st[id]?'checked':''}>`:''}</div></div>`;});});
 if(p.follow)html+=`<div class="card follow"><h3>🎵 推荐：跟着音乐整套练</h3><div class="tp">${V[p.follow].t}</div><button class="vbtn" data-v="${p.follow}">▶ 立刻跟练</button></div>`;
 $('plan').innerHTML=html;
 const d=$('done');d.style.display=sel==today.getDay()?'block':'none';d.className='done'+(L[tk].done?' ok':'');d.textContent=L[tk].done?'🎉 今天已打卡，真棒！（再点取消）':'✅ 今天练完啦，打卡！';
 const ws=new Date(today);ws.setDate(today.getDate()-((today.getDay()+6)%7));let s='',streak=0;
 for(let i=0;i<7;i++){const x=new Date(ws);x.setDate(ws.getDate()+i);const kk=key(new Date(x.getTime()-x.getTimezoneOffset()*6e4));
  s+=`<span class="${L[kk]&&L[kk].done?'on':''} ${kk==tk?'today':''}">${DAYS[x.getDay()]}${L[kk]&&L[kk].done?' ✓':''}</span>`;}
 {const x=new Date(today);const K=()=>key(new Date(x.getTime()-x.getTimezoneOffset()*6e4));if(!(L[tk].done))x.setDate(x.getDate()-1);while(L[K()]&&L[K()].done&&streak<999){streak++;x.setDate(x.getDate()-1);}}
 $('streak').innerHTML=s;$('sub').textContent=p.sub+(streak?` · 已连续打卡 ${streak} 天 🔥`:'');
 document.querySelectorAll('#knee button').forEach(b=>b.classList.toggle('sel',b.dataset.v==L[tk].knee));
 const tip=$('kneeTip');const kv=L[tk].knee;tip.className='tip'+(kv=='swollen'?' warn':'');
 tip.innerHTML=kv=='swollen'?'🧊 <b>今天先停练吧。</b>冰敷 15 分钟左右、抬高腿休息。如果肿胀明显、打软、卡住或夜里痛，尽快去看骨科/康复科哦。':kv=='sore'?'有点酸就减量：组数减一组、静蹲站高一点。疼痛超过 3/10 就停～':kv=='ok'?'状态不错！按计划来，别贪多 😉':'';}
document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
 if(t.dataset.d){sel=+t.dataset.d;render();}
 else if(t.dataset.v&&t.closest('#knee')){L[tk].knee=t.dataset.v;save();render();}
 else if(t.dataset.v){const v=V[t.dataset.v];$('mtitle').textContent=v.t;
  $('vwrap').innerHTML=`<iframe src="https://player.bilibili.com/player.html?bvid=${v.bv}&autoplay=0&high_quality=1" allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe>`;
  $('mlink').href='https://www.bilibili.com/video/'+v.bv;$('modal').classList.add('show');}
 else if(t.dataset.s){location.href='https://search.bilibili.com/all?keyword='+encodeURIComponent(t.dataset.s);}
 else if(t.id=='mclose'){$('modal').classList.remove('show');$('vwrap').innerHTML='';}
 else if(t.id=='done'){L[tk].done=!L[tk].done;save();render();}});
document.addEventListener('change',e=>{if(e.target.dataset.k){L[tk].steps=L[tk].steps||{};L[tk].steps[e.target.dataset.k]=e.target.checked;save();}});
render();if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
