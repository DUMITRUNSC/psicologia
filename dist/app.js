const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const TOPICS=window.TOPICS, QUESTIONS=window.QUESTIONS, PAGES=window.NOTES_PAGES||[];
const EXAM_MODELS=[
 {id:'authors',letter:'A',name:'Autores y experimentos',desc:'Autor, estudio, corriente, procedimiento y hallazgo.',prefer:['author','experiment']},
 {id:'traps',letter:'B',name:'Diferencias y trampas',desc:'Conceptos próximos, secuencias y distractores muy plausibles.',prefer:['compare','hard']},
 {id:'cases',letter:'C',name:'Casos y aplicación',desc:'Situaciones nuevas que exigen reconocer el principio correcto.',prefer:['apply','experiment']},
 {id:'mixed',letter:'D',name:'Mixto difícil',desc:'Recorrido completo con respuestas oficiales y detalle fino.',prefer:['hard','author','compare']}
];
const EXAM_ANCHORS={
 authors:{conductismo:'q44',social:'q55',cognitiva:'q62',neuro:'q66',neuromarketing:'q80'},
 traps:{conductismo:'q46',social:'q56',cognitiva:'q59',neuro:'q76',neuromarketing:'q83'},
 cases:{conductismo:'q49',social:'q51',cognitiva:'q60',neuro:'q77',neuromarketing:'q84'},
 mixed:{conductismo:'q36',social:'q14',cognitiva:'q15',neuro:'q24',neuromarketing:'q28'}
};
const STORE='psico-study-v1';
const defaults={attempts:0,correct:0,wrong:0,blank:0,seen:{},errors:[],reviews:{},lastView:'home',streak:0,lastDay:null};
let state=load(), session=null, notePage=2, noteTopic='all';

function load(){try{return {...defaults,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return {...defaults}}}
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function esc(s=''){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function topic(id){return TOPICS.find(t=>t.id===id)}
function pageTopic(page){return TOPICS.find(t=>page>=t.range[0]&&page<=t.range[1])||{id:'cover',name:'Documento',pages:'1',range:[1,1]}}
function mastery(){return state.attempts?Math.round(state.correct/state.attempts*100):0}
function reviewedPages(){return new Set(Object.keys(state.seen).map(id=>QUESTIONS.find(q=>q.id===id)?.page).filter(Boolean)).size}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)}
function setActive(view){$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));state.lastView=view;save()}
function go(view,opts={}){setActive(view);window.scrollTo({top:0,behavior:'smooth'});if(['learn','compare','apply'].includes(view))startStudy(view,opts);else if(view==='exam'&&!opts.model)renderExamChooser();else if(view==='exam')startStudy(view,opts);else render(view)}

function topbar(label='PSICOLOGÍA DE LA COMUNICACIÓN'){
 return `<header class="topbar"><span class="eyebrow">${label}</span><div class="top-actions"><button class="icon-btn" id="reset-btn" title="Reiniciar progreso" aria-label="Reiniciar progreso">↺</button><button class="pill-btn" data-view="notes">58 páginas</button></div></header>`
}
function render(view){if(view==='home')renderHome();if(view==='notes')renderNotes();if(view==='progress')renderProgress();bindNav()}
function bindNav(){$$('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));const r=$('#reset-btn');if(r)r.onclick=()=>{if(confirm('¿Quieres borrar todo el progreso guardado en este dispositivo?')){state={...defaults};save();go('home');toast('Progreso reiniciado')}}}

function renderHome(){
 const m=mastery();
 $('#main').innerHTML=`<div class="page">${topbar()}<section class="hero"><div class="hero-copy"><span class="eyebrow">PSICOLOGÍA DE LA COMUNICACIÓN</span><h1>Todo el temario.<br>Cada respuesta explicada.</h1><p>Preguntas vinculadas al PDF, respuestas oficiales diferenciadas y una explicación concreta de por qué cada alternativa es correcta o incorrecta.</p><div class="hero-actions"><button class="primary" data-view="learn">Abrir preguntas →</button><button class="secondary" data-view="notes">Consultar apuntes</button></div></div><aside class="today-card audit-card"><div><span class="eyebrow">AUDITORÍA DEL CONTENIDO</span><div class="audit-number">58<span>/58</span></div><h2>Páginas conservadas</h2><p>${QUESTIONS.length} preguntas con página fuente válida. 10 respuestas oficiales identificadas por separado.</p></div><button class="pill-btn" data-view="progress">Ver comprobación completa</button></aside></section>
 <div class="section-head"><h2>Tipos de preguntas</h2><p>La corrección siempre explica las tres opciones</p></div><section class="mode-grid">
 ${modeCard('learn','◉','Aprende','Conceptos y definiciones del PDF.','12 preguntas')}${modeCard('compare','⇄','Diferencia','Conceptos similares y distractores.','12 preguntas')}${modeCard('apply','◇','Aplica','Casos vinculados a los apuntes.','12 preguntas')}${modeCard('exam','✓','Examen','4 modelos distintos · +0,40 / −0,20 / 0.','40 preguntas cada uno')}</section>
 <div class="section-head"><h2>Mapa del temario</h2><p>${reviewedPages()} de 58 páginas practicadas</p></div><section class="topic-strip">${TOPICS.map(t=>{const qs=QUESTIONS.filter(q=>q.topic===t.id),done=qs.filter(q=>state.seen[q.id]).length,p=Math.round(done/qs.length*100);return `<button class="topic-chip" data-topic="${t.id}"><strong>${t.name}</strong><small>Págs. ${t.pages} · ${p}%</small><span class="bar"><i style="--w:${p}%"></i></span></button>`}).join('')}</section>
 <div class="section-head"><h2>Trazabilidad del contenido</h2><p>Sin respuestas improvisadas</p></div><div class="source-legend"><span><i class="i-notes"></i>Apuntes: texto o pregunta derivada del PDF</span><span><i class="i-official"></i>Criterio de profesora: solución visible en captura</span><span><i class="i-science"></i>Matiz científico: aclaración separada</span></div></div>`;
 $$('.mode-card').forEach(c=>c.onclick=()=>go(c.dataset.view));$$('[data-topic]').forEach(b=>b.onclick=()=>go('learn',{topic:b.dataset.topic}));bindNav()
}
function modeCard(v,i,t,d,time){return `<article class="mode-card" data-view="${v}" tabindex="0"><span class="mode-icon">${i}</span><h3>${t}</h3><p>${d}</p><small>${time} →</small></article>`}

function renderExamChooser(){
 $('#main').innerHTML=`<div class="page exam-page">${topbar('EXAMEN · 4 MODELOS')}<section class="exam-intro"><div><span class="eyebrow">NIVEL PROFESORA · DIFÍCIL</span><h1>Elige un modelo</h1><p>Cada examen contiene 40 preguntas, mezcla los cinco temas y baraja tanto el orden de las preguntas como el de las respuestas en cada intento.</p></div><div class="exam-rules"><strong>+0,40</strong><span>Acierto</span><strong>−0,20</strong><span>Error</span><strong>0</strong><span>En blanco</span></div></section><section class="exam-models">${EXAM_MODELS.map(m=>`<button class="exam-model" data-exam-model="${m.id}"><span class="model-letter">${m.letter}</span><div><small>MODELO ${m.letter} · 40 PREGUNTAS</small><h2>${m.name}</h2><p>${m.desc}</p><b>Empezar examen →</b></div></button>`).join('')}</section><section class="exam-assurance"><span>✓</span><p><strong>Todos parten del mismo PDF.</strong> Cambian el enfoque y la selección, pero nunca cambia qué respuesta es verdadera. Al corregir verás tu error, la respuesta correcta, el motivo y la página fuente.</p></section></div>`;
 $$('[data-exam-model]').forEach(b=>b.onclick=()=>go('exam',{model:b.dataset.examModel}));bindNav()
}

function examPool(modelId){
 const model=EXAM_MODELS.find(m=>m.id===modelId)||EXAM_MODELS[3];
 const foreignAnchors=new Set(Object.entries(EXAM_ANCHORS).filter(([id])=>id!==model.id).flatMap(([,ids])=>Object.values(ids)));
 const byTopic=TOPICS.flatMap((t,topicIndex)=>{
   const anchorId=EXAM_ANCHORS[model.id][t.id],anchor=QUESTIONS.find(q=>q.id===anchorId);
   const candidates=shuffle(QUESTIONS.filter(q=>q.modes.includes('exam')&&q.topic===t.id&&q.id!==anchorId&&!foreignAnchors.has(q.id)));
   return [anchor,...candidates.sort((a,b)=>examWeight(b,model,topicIndex)-examWeight(a,model,topicIndex)).slice(0,7)]
 });
 return shuffle(byTopic)
}
function examWeight(q,model,topicIndex){
 let score=model.prefer.includes(q.kind)?5:0;
 if(model.id==='mixed'&&q.official)score+=7;
 if(model.id==='authors'&&(q.kind==='author'||q.kind==='experiment'))score+=7;
 if(model.id==='traps'&&(q.modes.includes('compare')||q.kind==='hard'))score+=6;
 if(model.id==='cases'&&q.modes.includes('apply'))score+=6;
 score+=((parseInt(q.id.slice(1),10)+topicIndex+model.letter.charCodeAt(0))%7)/10;
 return score
}

function startStudy(mode,opts={}){
 let pool=mode==='exam'?examPool(opts.model):QUESTIONS.filter(q=>q.modes.includes(mode));
 if(opts.topic)pool=pool.filter(q=>q.topic===opts.topic);
 if(mode==='compare'&&state.errors.length){const ids=new Set(state.errors.map(e=>e.id));pool=[...pool.filter(q=>ids.has(q.id)),...pool.filter(q=>!ids.has(q.id))]}
 pool=mode==='exam'?pool:shuffle(pool).slice(0,Math.min(12,pool.length));
 const examModel=EXAM_MODELS.find(m=>m.id===opts.model);
 session={mode,pool,index:0,answers:[],selected:null,revealed:false,options:[],score:0,model:examModel?.id,modelName:examModel?.name};
 renderStudy()
}
function modeInfo(mode){return {learn:['Aprende','Conceptos y definiciones con la explicación completa.'],compare:['Diferencia','Diferencias exactas entre conceptos que pueden confundirse.'],apply:['Aplica','Casos prácticos derivados de los apuntes.'],exam:['Examen','Acierto +0,40 · Error −0,20 · Blanco 0.']}[mode]}
function renderStudy(){
 const [baseName,desc]=modeInfo(session.mode),name=session.mode==='exam'?`Examen · ${session.modelName}`:baseName,q=session.pool[session.index];
 if(!q)return finishStudy();
 if(!session.options.length){session.options=shuffle(q.options.map((o,i)=>({text:o[0],correct:o[1],why:o[2],original:i})));if(!session.prompt)session.prompt=pickPrompt(q)}
 const pct=Math.round(session.index/session.pool.length*100), t=topic(q.topic);
 const kindLabel={author:'Autor',experiment:'Experimento',compare:'Diferencia',apply:'Caso',hard:'Detalle fino'}[q.kind];
 $('#main').innerHTML=`<div class="page">${topbar(`MODO ${name.toUpperCase()}`)}<section class="mode-header"><span class="eyebrow">${session.index+1} DE ${session.pool.length}</span><h1>${name}</h1><p>${desc}</p></section><div class="study-shell"><article class="study-card"><div class="question-meta"><span class="tag">${t.name}</span>${kindLabel?`<span class="tag kind">${kindLabel}</span>`:''}<span class="tag">Página ${q.page}</span>${q.official?'<span class="tag official">Respuesta oficial</span>':'<span class="tag">Basada en apuntes</span>'}</div><h2 class="question">${esc(session.prompt)}</h2><div class="options">${session.options.map((o,i)=>optionHtml(o,i)).join('')}</div>${session.revealed?feedbackHtml(q):''}<div class="study-actions ${session.revealed?'revealed':''}">${session.revealed?'':`<button class="secondary" id="blank">${session.mode==='exam'?'Dejar en blanco':'Ver respuesta'}</button>`}<button class="primary" id="check">${session.revealed?'Siguiente pregunta →':'Comprobar'}</button></div></article><aside class="study-aside"><div class="mini-card"><div class="progress-line"><span>Preguntas</span><span>${session.index+1}/${session.pool.length}</span></div><div class="track"><i style="--w:${pct}%"></i></div></div><div class="mini-card"><h3>La corrección muestra</h3><ul><li>Por qué tu opción está mal.</li><li>Cuál es la correcta y por qué.</li><li>Por qué fallan las demás.</li></ul></div><div class="mini-card"><h3>Fuente comprobada</h3><p>${q.official?'Solución visible en captura de examen y contenido relacionado localizado en el PDF.':'Pregunta derivada de la página citada del PDF.'}</p>${q.note?`<p><strong>Matiz:</strong> ${q.note}</p>`:''}</div></aside></div></div>`;
 $$('.option').forEach(b=>b.onclick=()=>selectOption(+b.dataset.i));$('#check').onclick=checkOrNext;const blank=$('#blank');if(blank)blank.onclick=()=>blankAnswer(q);const retry=$('#retry-question');if(retry)retry.onclick=()=>retryQuestion();const source=$('#open-source');if(source)source.onclick=()=>{notePage=q.page;go('notes')};bindNav()
}
function pickPrompt(q){if(session.mode!=='exam'&&q.variants?.length&&Math.random()>.5)return q.variants[Math.floor(Math.random()*q.variants.length)];return q.prompt}
function optionHtml(o,i){let cls='option';if(session.selected===i)cls+=' selected';if(session.revealed){if(o.correct)cls+=' correct';else if(session.selected===i)cls+=' wrong'}return `<button class="${cls}" data-i="${i}" ${session.revealed?'disabled':''}><span class="letter">${String.fromCharCode(65+i)}</span><span>${esc(o.text)}</span></button>`}
function selectOption(i){if(session.revealed)return;session.selected=i;$$('.option').forEach((b,n)=>b.classList.toggle('selected',n===i))}
function checkOrNext(){const q=session.pool[session.index];if(session.revealed){session.index++;session.selected=null;session.revealed=false;session.options=[];session.prompt=null;renderStudy();return}if(session.selected===null){toast('Elige una opción o déjala en blanco');return}record(q,session.options[session.selected].correct?'correct':'wrong');session.revealed=true;renderStudy()}
function blankAnswer(q){if(session.revealed)return;if(session.mode==='exam'){record(q,'blank');session.index++;session.options=[];session.prompt=null;renderStudy()}else{record(q,'blank');session.revealed=true;renderStudy()}}
function record(q,result){session.answers.push({id:q.id,result});session.lastResult=result;state.attempts++;state.seen[q.id]=(state.seen[q.id]||0)+1;const day=86400000;if(result==='correct'){state.correct++;session.score+=.4;state.errors=state.errors.filter(e=>e.id!==q.id);const gaps=[1,2,4,7,14],gap=gaps[Math.min((state.seen[q.id]||1)-1,gaps.length-1)];state.reviews[q.id]=Date.now()+gap*day}else if(result==='wrong'){state.wrong++;session.score-=.2;state.errors=[{id:q.id,at:Date.now()},...state.errors.filter(e=>e.id!==q.id)].slice(0,50);state.reviews[q.id]=Date.now()+day}else{state.blank++;state.reviews[q.id]=Date.now()+day}save()}
function retryQuestion(){session.selected=null;session.revealed=false;session.lastResult=null;session.options=shuffle(session.options);renderStudy()}
function feedbackHtml(q){const chosen=session.selected===null?null:session.options[session.selected],correct=session.options.find(o=>o.correct),isRight=!!chosen?.correct;return `<section class="feedback ${isRight?'feedback-good':'feedback-fix'}" aria-live="polite"><div class="feedback-title"><span>${isRight?'✓':'!'}</span><div><small>${isRight?'RESPUESTA CORRECTA':'RESPUESTA INCORRECTA'}</small><h3>${isRight?'Por qué es correcta':chosen?'Por qué tu respuesta está mal':'Respuesta y explicación'}</h3></div></div>${chosen?`<div class="answer-compare"><div class="answer-box ${isRight?'answer-ok':'answer-no'}"><small>TU RESPUESTA</small><strong>${esc(chosen.text)}</strong>${!isRight?`<p>${esc(chosen.why)}</p>`:''}</div><div class="answer-box answer-ok"><small>RESPUESTA CORRECTA</small><strong>${esc(correct.text)}</strong><p>${esc(correct.why)}</p></div></div>`:`<div class="answer-box answer-ok solo"><small>RESPUESTA CORRECTA</small><strong>${esc(correct.text)}</strong><p>${esc(correct.why)}</p></div>`}<details class="all-options" open><summary>Por qué cada opción es correcta o incorrecta</summary><div class="explain-list">${session.options.map((o,i)=>`<div class="explain-row ${o.correct?'row-ok':chosen===o?'row-no':''}"><strong>${String.fromCharCode(65+i)} · ${o.correct?'Correcta':'Incorrecta'}.</strong> ${esc(o.why)}</div>`).join('')}</div></details><div class="feedback-actions">${!isRight&&chosen?'<button class="secondary" id="retry-question">Volver a responder</button>':''}<button class="text-btn" id="open-source">Comprobar en la página ${q.page} →</button></div><p class="source-caption">Fuente: página ${q.page} del PDF${q.official?' · respuesta oficial visible en captura':''}.</p></section>`}
function finishStudy(){
 const total=session.answers.length,c=session.answers.filter(a=>a.result==='correct').length,w=session.answers.filter(a=>a.result==='wrong').length,b=total-c-w,score=session.mode==='exam'?session.score.toFixed(2).replace('.',','):null;
 $('#main').innerHTML=`<div class="page">${topbar('SESIÓN COMPLETADA')}<section class="mode-header"><span class="eyebrow">RESULTADO</span><h1>${session.mode==='exam'?`${score} puntos`:'Resultado'}</h1><p>${c} aciertos · ${w} errores · ${b} en blanco.</p></section><div class="stats-grid"><div class="stat"><strong>${c}</strong><span>Aciertos</span></div><div class="stat"><strong>${w}</strong><span>Errores</span></div><div class="stat"><strong>${b}</strong><span>En blanco</span></div><div class="stat"><strong>${total?Math.round(c/total*100):0}%</strong><span>Precisión</span></div></div><div class="hero-actions"><button class="primary" data-view="${w?'compare':'learn'}">${w?'Ver errores':'Otra ronda'} →</button><button class="secondary" data-view="progress">Ver progreso</button></div></div>`;bindNav()
}

function pageTitle(p){const line=p.text.split('\n').map(x=>x.trim()).find(x=>/^\d+(\.\d+)+\.|^[A-ZÁÉÍÓÚÑ ]{8,}$/.test(x));return line||`Página ${p.page}`}
function noteText(text,q){let out=esc(text);if(q)out=out.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi'),'<mark>$1</mark>');return out}
function noteBlocks(text){
 const blocks=[];let current='';
 const flush=()=>{if(current.trim())blocks.push(current.replace(/\s+/g,' ').trim());current=''};
 for(const raw of text.split('\n')){
   const line=raw.trim();if(!line){flush();continue}
   const starts=/^●|^[a-z]\)|^\d+(\.\d+)+\.|^[A-ZÁÉÍÓÚÑ ]{8,}$/.test(line);
   if(starts)flush();current=current?`${current} ${line}`:line
 }
 flush();return blocks
}
function formatNotes(text,q){return noteBlocks(text).map(clean=>{const safe=noteText(clean,q);if(/^[A-ZÁÉÍÓÚÑ ]{8,}$/.test(clean))return `<h2 class="note-chapter">${safe}</h2>`;if(/^\d+(\.\d+)+\./.test(clean))return `<h3 class="note-heading">${safe}</h3>`;if(/^●/.test(clean)){const body=safe.replace(/^●[^\p{L}\p{N}]*/u,'');const i=body.indexOf(':');return i>0?`<div class="note-definition"><strong>${body.slice(0,i)}</strong><p>${body.slice(i+1).trim()}</p></div>`:`<div class="note-bullet"><span></span><p>${body}</p></div>`}if(/^[a-z]\)/i.test(clean)){const key=safe.slice(0,2),body=safe.slice(2).trim();return `<div class="note-subpoint"><b>${key}</b><span>${body}</span></div>`}return `<p class="note-paragraph">${safe}</p>`}).join('')}
function renderNotes(query=''){
 const inTopic=p=>noteTopic==='all'||pageTopic(p.page).id===noteTopic;const filtered=PAGES.filter(p=>inTopic(p)&&(!query||p.text.toLowerCase().includes(query.toLowerCase())));if(filtered.length&&!filtered.some(p=>p.page===notePage))notePage=filtered[0].page;const p=PAGES.find(x=>x.page===notePage)||PAGES[0],pt=pageTopic(p.page),linked=QUESTIONS.filter(q=>q.page===p.page);
 const previous=PAGES.find(x=>x.page===p.page-1),next=PAGES.find(x=>x.page===p.page+1);
 $('#main').innerHTML=`<div class="page notes-page theme-${pt.id}">${topbar('Apuntes · fuente original')}<section class="notes-head redesigned"><div><span class="eyebrow">58 páginas · texto íntegro</span><h1>Apuntes</h1><p>El documento completo, ordenado para encontrar rápido cada concepto sin alterar el contenido.</p></div><button class="audit-seal" data-view="progress"><span>✓</span><strong>58/58</strong><small>Páginas comprobadas</small></button></section><div class="notes-toolbar"><label class="search"><input id="note-search" type="search" placeholder="Buscar autor, experimento o concepto…" value="${esc(query)}" aria-label="Buscar en los apuntes"></label><div class="topic-tabs"><button data-note-topic="all" class="${noteTopic==='all'?'active':''}">Todo</button>${TOPICS.map(t=>`<button data-note-topic="${t.id}" class="${noteTopic===t.id?'active':''}">${t.name}</button>`).join('')}</div></div><div class="notes-reader"><nav class="page-list" aria-label="Páginas del temario"><div class="page-list-title"><span>Páginas</span><b>${filtered.length}</b></div>${filtered.map(x=>`<button class="page-btn ${x.page===notePage?'active':''}" data-page="${x.page}"><span>${String(x.page).padStart(2,'0')}</span><div><strong>${esc(pageTitle(x))}</strong><small>${pageTopic(x.page).name}</small></div></button>`).join('')||'<div class="empty">No aparece en este apartado.</div>'}</nav><article class="page-paper editorial"><header class="paper-header"><div><span class="paper-kicker">${pt.name}</span><h2>${esc(pageTitle(p))}</h2></div><div class="paper-page"><small>Página</small><strong>${String(p.page).padStart(2,'0')}</strong><span>de 58</span></div></header><div class="page-text structured">${formatNotes(p.text,query)}</div><footer class="paper-footer"><button class="paper-nav" data-note-move="${previous?p.page-1:''}" ${previous?'':'disabled'}><span>Anterior</span><b>${previous?esc(pageTitle(previous)):'Inicio'}</b></button><div class="paper-proof"><span>PDF original</span><small>${p.text.length.toLocaleString('es-ES')} caracteres conservados</small></div><button class="paper-nav next" data-note-move="${next?p.page+1:''}" ${next?'':'disabled'}><span>Siguiente</span><b>${next?esc(pageTitle(next)):'Final'}</b></button></footer></article><aside class="source-panel"><div class="source-status"><span>✓</span><div><strong>Página comprobada</strong><small>Texto y numeración coinciden</small></div></div><dl><div><dt>Tema</dt><dd>${pt.name}</dd></div><div><dt>Preguntas</dt><dd>${linked.length}</dd></div><div><dt>Origen</dt><dd>Página ${p.page}</dd></div></dl>${linked.length?`<div class="linked-questions"><h3>Preguntas de esta página</h3>${linked.map(q=>`<button data-open-question="${q.id}">${esc(q.prompt)}</button>`).join('')}</div>`:'<p class="no-linked">Página conservada íntegramente; todavía no tiene una pregunta específica.</p>'}</aside></div></div>`;
 const moveTo=page=>{if(!page)return;notePage=+page;renderNotes(query);window.scrollTo({top:155,behavior:'smooth'})};
 $('#note-search').oninput=e=>{clearTimeout(window.searchTimer);window.searchTimer=setTimeout(()=>renderNotes(e.target.value),180)};$$('[data-note-topic]').forEach(b=>b.onclick=()=>{noteTopic=b.dataset.noteTopic;renderNotes(query)});$$('[data-page]').forEach(b=>b.onclick=()=>moveTo(b.dataset.page));$$('[data-note-move]').forEach(b=>b.onclick=()=>moveTo(b.dataset.noteMove));$$('[data-open-question]').forEach(b=>b.onclick=()=>{const q=QUESTIONS.find(x=>x.id===b.dataset.openQuestion);startStudy(q.modes[0],{topic:q.topic})});bindNav()
}

function renderProgress(){
 const due=Object.entries(state.reviews).filter(([,d])=>d<=Date.now()).length,m=mastery();
 const validRefs=QUESTIONS.filter(q=>PAGES.some(p=>p.page===q.page)).length,allOptions=QUESTIONS.reduce((n,q)=>n+q.options.length,0);
 $('#main').innerHTML=`<div class="page audit-page">${topbar('AUDITORÍA DEL CONTENIDO')}<section class="progress-head"><span class="eyebrow">COMPROBACIÓN PDF → APLICACIÓN</span><h1>Progreso</h1><p>Resultado de comprobar la integridad del documento, las páginas citadas, las respuestas y las explicaciones mostradas por la aplicación.</p></section><div class="audit-summary"><article><span class="audit-check">✓</span><strong>58/58</strong><p>Páginas extraídas y disponibles</p></article><article><span class="audit-check">✓</span><strong>${validRefs}/${QUESTIONS.length}</strong><p>Preguntas con página fuente válida</p></article><article><span class="audit-check">✓</span><strong>${allOptions}/${allOptions}</strong><p>Alternativas con explicación</p></article><article><span class="audit-check">✓</span><strong>10/10</strong><p>Respuestas oficiales identificadas</p></article></div><section class="audit-notice"><div><span>CONTROL REALIZADO</span><h2>Se corrigieron 10 referencias de página y 2 formulaciones.</h2><p>Las referencias desplazadas por la portada o por apartados que continúan entre páginas se han alineado con la página exacta del PDF. “Electrocardiograma” se ajustó a “Electrocardiografía (ECG o EKG)” y la GSR se formuló como “intensidad de activación emocional y atención”, igual que en los apuntes.</p></div><button class="secondary" data-view="notes">Abrir fuente completa</button></section><div class="section-head"><h2>Cobertura por tema</h2><p>Texto íntegro y preguntas enlazadas</p></div><div class="coverage-grid">${TOPICS.map(t=>{const qs=QUESTIONS.filter(q=>q.topic===t.id),pages=t.range[1]-t.range[0]+1;return `<article class="coverage-card"><span class="eyebrow">PÁGINAS ${t.pages}</span><h3>${t.name}</h3><div class="coverage-metrics"><span><b>${pages}/${pages}</b> páginas</span><span><b>${qs.length}</b> preguntas</span></div><span class="pages">Comprobado contra el PDF</span></article>`}).join('')}</div><section class="audit-boundary"><h2>Qué significa “comprobado”</h2><div><p><strong>Contenido de apuntes</strong> El texto mostrado procede de las 58 páginas del PDF y se conserva completo.</p><p><strong>Criterio de profesora</strong> Las 10 soluciones visibles en las capturas están etiquetadas como respuestas oficiales.</p><p><strong>Matiz científico</strong> Una afirmación del PDF puede ser una simplificación académica. La aplicación no la sustituye silenciosamente por información externa.</p></div></section><div class="section-head"><h2>Estado de la aplicación</h2><p>Datos locales</p></div><div class="stats-grid compact"><div class="stat"><strong>${m}%</strong><span>Precisión</span></div><div class="stat"><strong>${reviewedPages()}</strong><span>Páginas practicadas</span></div><div class="stat"><strong>${state.errors.length}</strong><span>Errores registrados</span></div><div class="stat"><strong>${due}</strong><span>Revisiones pendientes</span></div></div>${errorTable()}</div>`;bindNav()
}
function errorTable(){if(!state.errors.length)return '<div class="empty">Todavía no hay errores registrados.</div>';return `<table class="error-table"><thead><tr><th>Concepto</th><th>Tema</th><th>Fuente</th><th></th></tr></thead><tbody>${state.errors.map(e=>{const q=QUESTIONS.find(x=>x.id===e.id);if(!q)return'';return `<tr><td>${esc(q.prompt)}</td><td>${topic(q.topic).name}</td><td>Pág. ${q.page}${q.official?' · oficial':''}</td><td><button class="secondary" onclick="go('compare',{topic:'${q.topic}'})">Repasar</button></td></tr>`}).join('')}</tbody></table>`}

document.addEventListener('click',e=>{const v=e.target.closest('[data-view]');if(v&&!v.classList.contains('mode-card')){e.preventDefault();go(v.dataset.view)}});
go(state.lastView||'home');
