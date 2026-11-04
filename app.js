const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let current=2,subtype=-1,expanded=false,selected=null,matrixCell=null;
const num=i=>String(i+1).padStart(2,'0');
function rowMarkup(r){return `<button class="task-row ${selected?.id===r.id?'active':''}" data-task="${esc(r.id)}"><span>${esc(r.name)}${MEDIA[r.id]?' · ◉':''}</span><small>${MEDIA[r.id]?(MEDIA[r.id].type==='video'?'实拍视频':'现场图片'):'操作记录'}</small><em>${esc(DATA.objects[r.object])}</em></button>`}
function getRows(){return DATA.rows.filter(r=>r.group===current&&(subtype<0||new RegExp(EDITORIAL[current].match[subtype]).test(r.name)))}
function chooseFamily(i,branch=-1,scroll=false){current=i;subtype=branch;expanded=false;const rs=getRows(),ed=EDITORIAL[i];selected=rs.find(r=>r.id===ed.featured)||rs.find(r=>MEDIA[r.id])||rs[0]||null;renderFamily();if(scroll)$('#observatory').scrollIntoView({behavior:'smooth',block:'start'})}

const ATOMIC_ACTIONS = [
 ['接近','手或工具靠近目标，尚未建立操作接触'],
 ['抓取','建立对物体的持握'],
 ['保持','持续握持或稳定物体'],
 ['移动','将手、工具或持有物移向目标位置'],
 ['对齐','调整位置、方向，使对象满足配合条件'],
 ['旋转','改变对象角度或绕轴转动'],
 ['推动','施力使对象沿目标方向移动'],
 ['拉动','牵引对象移动或张紧'],
 ['按压','对目标施加压力'],
 ['插入','将对象送入孔、槽或接口'],
 ['拔出','将对象从配合结构中抽离'],
 ['放置','将持有物安置到目标支撑位置'],
 ['释放','解除持握或操作接触'],
 ['撤离','操作后使手或工具离开目标区域']
];
// Candidate actions describe task semantics; they are not timestamped video labels.
const ACTION_RULES = [
 ['接近',/靠近|接近|伸向/], ['抓取',/抓|握|拿|持取|手持|取出|取件|拿取|拾|穿绕/],
 ['保持',/固定|稳定|扶|夹持|夹紧|台钳|握持/], ['移动',/移动|搬|转运|送至|送入|取出|取件|拿取|放入|放置|装配|组装|走位|布线|穿绕/],
 ['对齐',/对齐|对位|对准|定位|装配|组装|插接|排线|走位|缝纫|拼接/],
 ['旋转',/旋|转动|拧|锁付|锁附|锁紧|螺丝|螺栓|螺母|翻转/],
 ['推动',/推动|推入|推车|推送/], ['拉动',/拉|张紧|张力|穿绕|牵引|绞合/],
 ['按压',/按压|按下|按钮|压入|压紧|压合|压铆|冲压/], ['插入',/插|穿过|穿入|穿线|穿绕|嵌入|装入/],
 ['拔出',/拔|抽出|脱模|取模/], ['放置',/放|装袋|装盒|装箱|包装|摆放|堆叠/],
 ['释放',/松开|释放|放下|放置|放回/], ['撤离',/撤离|移开|退出|离开/]
];
function getAtomicActions(r){
 const ed=EDITORIAL[r.group];
 const text=r.name+' '+r.description+(r.id===ed.featured?' '+ed.steps.flat().join(' '):'');
 const names=new Set(ACTION_RULES.filter(([,rule])=>rule.test(text)).map(([name])=>name));
 const inferred=names.size===0;
 const familyReference=[['抓取','移动','对齐','放置'],['抓取','保持','对齐','旋转'],['抓取','保持','移动'],['保持','对齐','移动'],['抓取','保持','移动'],['抓取','移动','放置'],['抓取','移动','放置'],['抓取','移动','放置']];
 if(inferred)(familyReference[r.group]||[]).forEach(name=>names.add(name));
 return {names:[...names],inferred};
}
function atomicMarkup(r){
 const {names,inferred}=getAtomicActions(r);
 const relevant=ATOMIC_ACTIONS.filter(([name])=>names.includes(name));
 return `<section class="atomic-section" aria-label="原子动作参考"><div class="atomic-heading"><div><span class="section-number">ATOMIC ACTIONS</span><h5>工序中的原子动作</h5></div><span class="atomic-count">${relevant.length?relevant.length+' 个候选动作':'动作词表参考'}</span></div><p class="atomic-intro">${inferred?'当前描述较简略，以下为该工序类别的动作参考，需结合视频确认。':'依据工序名称与描述整理的候选动作，不表示执行顺序或视频标注结果。'}左右手可同时执行不同动作。</p>${relevant.length?`<dl class="atomic-grid">${relevant.map(([name,meaning])=>`<div><dt>${name}</dt><dd>${meaning}</dd></div>`).join('')}</dl>`:'<p class="atomic-intro">当前文字不足以确定具体动作，可参照下方词表结合现场视频标注。</p>'}<details class="atomic-dictionary"><summary>查看全部 14 个原子动作及含义</summary><dl class="atomic-grid">${ATOMIC_ACTIONS.map(([name,meaning])=>`<div><dt>${name}</dt><dd>${meaning}</dd></div>`).join('')}</dl></details></section>`;
}

// Count scene records once per action, using the same labels as each task card.
// Family-reference labels remain separate from text-derived candidates.
function summarizeActions(rows){
 const records=rows.filter(r=>r.group>=0&&EDITORIAL[r.group]).map(row=>({row,...getAtomicActions(row)}));
 const actions=ATOMIC_ACTIONS.map(([name,meaning],order)=>{
  const matches=records.filter(r=>r.names.includes(name));
  const reference=matches.filter(r=>r.inferred).length;
  return {name,meaning,order,total:matches.length,direct:matches.length-reference,reference,matches};
 });
 return {records,actions,tagged:records.filter(r=>r.names.length).length,
  assignments:actions.reduce((sum,a)=>sum+a.total,0),referenceScenes:records.filter(r=>r.inferred).length};
}
let actionSort='frequency',activeAction=null;
function actionDistributionMarkup(){
 const rows=DATA.rows;
 const stats=summarizeActions(rows),denominator=stats.records.length;
 const actions=[...stats.actions].sort(actionSort==='frequency'?(a,b)=>b.total-a.total||a.order-b.order:(a,b)=>a.order-b.order);
 const max=Math.max(1,...actions.map(a=>a.total));
 const step=max<=10?2:max<=50?10:Math.ceil(max/40)*10;
 const axisMax=Math.ceil(max/step)*step;
 const ticks=Array.from({length:axisMax/step+1},(_,i)=>i*step);
 const scopeLabel='全部已归类场景';
 const percent=n=>denominator?(n/denominator*100).toFixed(1):'0.0';
 const chosen=stats.actions.find(a=>a.name===activeAction);
 return `<section class="action-distribution" aria-label="原子动作场景分布">
  <div class="distribution-controls"><p>统计范围 · 全部已归类场景</p><label>排列方式<select data-action-sort aria-label="动作分布排列方式"><option value="frequency" ${actionSort==='frequency'?'selected':''}>场景数降序</option><option value="dictionary" ${actionSort==='dictionary'?'selected':''}>动作词表顺序</option></select></label></div>
  <div class="distribution-metrics" aria-live="polite"><div><b>${stats.tagged}</b><span>带动作标签的场景</span></div><div><b>${stats.actions.filter(a=>a.total).length}<small> / 14</small></b><span>已覆盖动作</span></div><div><b>${stats.assignments}</b><span>场景 × 动作关联</span></div></div>
  <div class="distribution-legend"><span><i class="legend-direct"></i>文字推导</span><span><i class="legend-reference"></i>任务族参考</span></div>
  <figure class="action-chart"><figcaption>${esc(scopeLabel)} <span>场景数 / 场景覆盖率</span></figcaption>
   <div class="action-axis" aria-hidden="true"><span></span><div>${ticks.map(n=>`<span style="left:${n/axisMax*100}%">${n}</span>`).join('')}</div><span></span></div>
   <div class="action-bars">${actions.map(a=>`<button type="button" class="action-bar ${activeAction===a.name?'is-selected':''}" data-action-name="${a.name}" aria-expanded="${activeAction===a.name}" aria-controls="action-distribution-detail" aria-label="${a.name}：${a.total} 个场景，覆盖率 ${percent(a.total)}%，其中 ${a.direct} 个文字推导、${a.reference} 个任务族参考；查看对应工序"><span class="action-bar-label">${a.name}</span><span class="action-bar-plot" aria-hidden="true" style="--grid-step:${step/axisMax*100}%"><span class="action-bar-direct" style="width:${a.direct/axisMax*100}%"></span><span class="action-bar-reference" style="width:${a.reference/axisMax*100}%"></span></span><span class="action-bar-value"><b>${a.total}</b><small>${percent(a.total)}%</small></span></button>`).join('')}</div>
  </figure>
  <p class="distribution-note">每个场景的同一动作只计一次，可同时包含多个动作；覆盖率 = 含该动作的场景数 ÷ 当前范围内 ${denominator} 个场景，百分比之和可超过 100%。${stats.referenceScenes} 个场景使用任务族参考动作。标签沿用现有工序展示，属于候选参考，不代表人工视频标注或动作发生频次。零值仅表示当前标签未覆盖。</p>
  <div id="action-distribution-detail" class="distribution-detail" ${chosen?'':'hidden'}>${chosen?`<div class="distribution-detail-heading"><div><strong>${chosen.name}</strong><span>${esc(chosen.meaning)}</span></div><button type="button" data-close-action aria-label="收起动作对应工序">收起 ×</button></div><p>${chosen.total} 个对应场景 · 文字推导 ${chosen.direct} / 任务族参考 ${chosen.reference}</p><div class="distribution-task-list">${chosen.matches.length?chosen.matches.map(({row,inferred})=>`<button type="button" data-distribution-task="${esc(row.id)}" data-source-row="${row.sourceRow}"><span>${esc(row.name)}<small>${esc(row.id)} · ${esc(DATA.groups[row.group].name)}</small></span><em>${inferred?'任务族参考':'文字推导'}</em><span aria-hidden="true">↗</span></button>`).join(''):'<p>当前范围内暂无含此动作标签的场景。</p>'}</div>`:''}</div>
 </section>`;
}
function bindActionDistribution(){
 const panel=$('.action-distribution');if(!panel)return;
 function refresh(focusSelector){
  panel.outerHTML=actionDistributionMarkup();bindActionDistribution();
  if(focusSelector)$(focusSelector)?.focus({preventScroll:true});
 }
 panel.querySelector('[data-action-sort]').onchange=e=>{actionSort=e.target.value;refresh('[data-action-sort]')};
 panel.querySelectorAll('[data-action-name]').forEach(b=>b.onclick=()=>{
  activeAction=activeAction===b.dataset.actionName?null:b.dataset.actionName;
  refresh(`[data-action-name="${b.dataset.actionName}"]`);
  if(activeAction)$('#action-distribution-detail').scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 const close=panel.querySelector('[data-close-action]');if(close)close.onclick=()=>{const name=activeAction;activeAction=null;refresh(`[data-action-name="${name}"]`)};
 panel.querySelectorAll('[data-distribution-task]').forEach(b=>b.onclick=()=>{
  const row=DATA.rows.find(r=>r.id===b.dataset.distributionTask&&String(r.sourceRow)===b.dataset.sourceRow);if(!row)return;
  current=row.group;subtype=-1;expanded=false;selected=row;renderFamily();
  const heading=$('#case-study h4');heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({behavior:'smooth',block:'start'});
 });
}

function renderCase(){const r=selected,ed=EDITORIAL[current];if(!r){$('#case-study').innerHTML='<div class="empty">这一分支暂未匹配到任务，请切换其他分支。</div>';return}const media=MEDIA[r.id];let mediaHTML='';if(media?.src)mediaHTML=`<figure class="media-frame">${media.type==='video'?`<video controls playsinline muted preload="metadata" ${media.poster?`poster="${esc(media.poster)}"`:''} src="${esc(media.src)}"></video>`:`<img src="${esc(media.src)}" alt="${esc(r.name)}现场采集">`}<figcaption>${esc(media.caption||r.name)} · 原始画面比例</figcaption></figure>`;
 const process=r.id===ed.featured?`<div class="process-label">操作过程 / TASK SEQUENCE</div><ol>${ed.steps.map((s,i)=>`<li><span>${i+1}</span><div><strong>${s[0]}</strong><p>${s[1]}</p></div></li>`).join('')}</ol><div class="process-foot">依据任务文字描述整理，非视频逐帧标注。</div>`:`<div class="process-label">观察维度 / OBSERVATION</div><dl class="meta"><dt>操作任务族</dt><dd>${DATA.groups[r.group].name}</dd><dt>操作对象</dt><dd>${DATA.objects[r.object]}</dd></dl><div class="process-foot">${media?'实拍素材与清单任务对应展示。':'本页暂未接入该任务的实拍附件。具体动作边界与质量指标以采集结果为准。'}</div>`;
 $('#case-study').innerHTML=`<article class="study ${media?.portrait?'portrait':''}"><div class="study-label"><span>任务观察 / ${esc(r.id)}</span><span>清单记录 ${r.sourceRow}</span></div><h4>${esc(r.name)}</h4>${mediaHTML}<div class="study-grid"><div><p>${esc(r.description)}</p><dl class="meta"><dt>场景编号</dt><dd>${esc(r.id)}</dd><dt>操作对象</dt><dd>${DATA.objects[r.object]}</dd></dl>${r.note?`<p class="study-note">${esc(r.note)}</p>`:''}</div><div class="process">${process}</div></div>${atomicMarkup(r)}</article>`;
 const video=$('#case-study video');if(video)video.addEventListener('error',()=>{const p=document.createElement('p');p.className='study-note';p.textContent='当前视频无法播放，请检查本地素材路径或视频格式。';video.after(p)},{once:true});
}
function bindTaskButtons(container,scroll=false){container.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>{const r=DATA.rows.find(x=>x.id===b.dataset.task);if(!r)return;if(current!==r.group||scroll){current=r.group;subtype=-1;expanded=false}selected=r;renderFamily();if(scroll)$('#observatory').scrollIntoView({behavior:'smooth',block:'start'})})}
function renderFamily(){const g=DATA.groups[current],ed=EDITORIAL[current],rs=getRows();$('#family-nav').innerHTML=DATA.groups.map((g,i)=>`<button data-family="${i}" class="${i===current?'active':''}" aria-pressed="${i===current}"><small>${num(i)}</small>${g.name}</button>`).join('');$$('[data-family]').forEach(b=>b.onclick=()=>chooseFamily(+b.dataset.family));$('#family-en').textContent=g.en;$('#family-title').textContent=g.name;$('#family-count').textContent=rs.length;$('#family-desc').textContent=ed.desc;$('#chapter').textContent=`${num(current)} / 08`;$('#subtypes').innerHTML=['全部任务',...ed.branches.map(x=>x[0])].map((s,i)=>`<button data-subtype="${i-1}" class="${subtype===i-1?'active':''}" aria-pressed="${subtype===i-1}">${s}</button>`).join('');$$('[data-subtype]').forEach(b=>b.onclick=()=>chooseFamily(current,+b.dataset.subtype));renderCase();$('#task-list').innerHTML=(expanded?rs:rs.slice(0,6)).map(rowMarkup).join('');bindTaskButtons($('#task-list'));$('#expand').hidden=rs.length<=6;$('#expand').textContent=expanded?'收起任务列表 −':`展开全部 ${rs.length} 条任务 +`;}
function matrixRows(){const q=$('#search').value.trim().toLowerCase();return DATA.rows.filter(r=>r.group>=0&&(!q||[r.id,r.name,r.description].join(' ').toLowerCase().includes(q)))}
function renderMatrix(){const rows=matrixRows();$('#match-count').textContent=`${rows.length} 条已归类场景`;$('#matrix').innerHTML='<table class="matrix"><thead><tr><th>操作任务 / 操作对象</th>'+DATA.objects.map(o=>`<th>${o}</th>`).join('')+'</tr></thead><tbody>'+DATA.groups.map((g,i)=>'<tr><th>'+g.name+'</th>'+DATA.objects.map((o,j)=>{let n=rows.filter(r=>r.group===i&&r.object===j).length;return `<td>${n?`<button data-matrix="${i},${j}" style="--strength:${Math.min(.32,.04+n*.01)}" class="${matrixCell&&matrixCell[0]===i&&matrixCell[1]===j?'matrix-selected':''}" aria-label="${g.name}，${o}，${n}条记录">${n}</button>`:'<span class="zero">—</span>'}</td>`}).join('')+'</tr>').join('')+'</tbody></table>';$$('[data-matrix]').forEach(b=>b.onclick=()=>{matrixCell=b.dataset.matrix.split(',').map(Number);renderMatrix();$('#matrix-detail').scrollIntoView({behavior:'smooth',block:'nearest'})});renderMatrixDetail(rows)}
function renderMatrixDetail(rows){const el=$('#matrix-detail');el.hidden=!matrixCell;if(!matrixCell)return;let [g,o]=matrixCell,rs=rows.filter(r=>r.group===g&&r.object===o);el.innerHTML=`<div class="matrix-detail-heading"><span>${DATA.groups[g].name} · ${DATA.objects[o]} / ${rs.length} 条</span><button id="close-matrix">收起 ×</button></div>${rs.length?rs.map(rowMarkup).join(''):'<p class="empty">当前筛选条件下没有匹配记录。</p>'}`;$('#close-matrix').onclick=()=>{matrixCell=null;renderMatrix()};bindTaskButtons(el,true)}
$('#branches').innerHTML=DATA.groups.map((g,i)=>`<div class="branch"><button class="family-link" data-branch-family="${i}">${g.name}<span>${g.en}</span></button><div class="branch-items">${EDITORIAL[i].branches.map((b,j)=>`<button data-branch="${i},${j}"><strong>${b[0]}</strong>${b[1]}</button>`).join('')}</div></div>`).join('');$$('[data-branch-family]').forEach(b=>b.onclick=()=>chooseFamily(+b.dataset.branchFamily,-1,true));$$('[data-branch]').forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.branch.split(',').map(Number);chooseFamily(i,j,true)});
const filmIds=['DS2026042304','DS2026081766','DS20261015282','DS20261020326'];$('#filmstrip').innerHTML=filmIds.map((id,i)=>{const r=DATA.rows.find(r=>r.id===id),m=MEDIA[id];return m?.poster?`<button data-task="${id}" aria-label="查看${esc(r.name)}"><img src="${esc(m.poster)}" alt="${esc(r.name)}现场画面"><span class="film-label"><small>OBSERVATION ${num(i)}</small>${esc(r.name)}</span></button>`:''}).join('');bindTaskButtons($('#filmstrip'),true);
$('#prev').onclick=()=>chooseFamily((current+7)%8);$('#next').onclick=()=>chooseFamily((current+1)%8);$('#expand').onclick=()=>{expanded=!expanded;renderFamily()};$('#search').oninput=renderMatrix;$('#reset').onclick=()=>{$('#search').value='';matrixCell=null;renderMatrix()};$('#full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('#full').textContent='请用浏览器全屏'}};document.addEventListener('fullscreenchange',()=>$('#full').textContent=document.fullscreenElement?'退出全屏':'全屏展示');chooseFamily(2);renderMatrix();

$('#action-distribution-root').innerHTML=actionDistributionMarkup();bindActionDistribution();
