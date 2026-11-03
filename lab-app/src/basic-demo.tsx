import React,{useState,useRef,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen,Check,ArrowLeft,Play} from 'lucide-react';
import {BasicJourney} from './components/BasicJourney';
import {createNextGamePlan} from './domain/game-plan-next';
import {getBibleProjectVideoForChapter} from './domain/bibleproject';
import {loadDemoChapter} from './features/demo-bible';
import type {DemoChapter} from './features/demo-bible';
import './basic-demo.css';
const plan=createNextGamePlan(365).stages;
function Demo(){
 const [screen,setScreen]=useState<'trail'|'reading'|'done'>('trail'),[index,setIndex]=useState(0),[end,setEnd]=useState(false),[video,setVideo]=useState(false),[help,setHelp]=useState(false);
 const [stage,setStage]=useState(1),[chapter,setChapter]=useState<DemoChapter|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const refs=plan[stage-1].chapters;
 const reading=refs[Math.min(index,refs.length-1)];
 useEffect(()=>{if(screen!=='reading')return;let live=true;setChapter(null);setError('');setEnd(false);loadDemoChapter(reading.id).then(c=>{if(live)setChapter(c)}).catch(()=>{if(live)setError('Não foi possível carregar. Tente novamente.')});return()=>{live=false}},[screen,stage,index,retry]);
 const article=useRef<HTMLElement>(null);
 useEffect(()=>{const el=article.current;if(screen==='reading'&&el&&el.scrollHeight<=el.clientHeight+32)setEnd(true)},[screen,index,chapter]);
 const panorama=getBibleProjectVideoForChapter(reading.book,reading.chapter);
 const begin=(day=stage)=>{setChapter(null);setStage(day);setIndex(0);setEnd(false);setVideo(false);setScreen('reading')};
 const next=()=>{setChapter(null);if(index===refs.length-1)setScreen('done');else{setIndex(i=>i+1);setEnd(false);setVideo(false)}};
 return <main className="public-demo"><header className="demo-top"><strong>LAB<span>GAME</span></strong><button type="button" aria-label="Sobre esta demonstração" onClick={()=>setHelp(v=>!v)}>ⓘ</button></header>
 {help&&<aside className="demo-note">Demonstração pública · sem cadastro. As 365 etapas estão liberadas para teste. Nenhum dado ou XP é registrado.<button onClick={()=>setHelp(false)}>Entendi</button></aside>}
 {screen==='trail'&&<nav className="demo-stage-nav" aria-label="Navegar pelas 365 etapas"><button aria-label="Semana anterior" disabled={stage===1} onClick={()=>setStage(s=>Math.max(1,s-7))}>←</button><label>Dia <input aria-label="Dia de teste" type="number" min={1} max={365} value={stage} onChange={e=>setStage(Math.max(1,Math.min(365,Number(e.target.value)||1)))}/> /365</label><button aria-label="Próxima semana" disabled={stage===365} onClick={()=>setStage(s=>Math.min(365,s+7))}>→</button></nav>}
 {screen==='trail'?<BasicJourney stage={stage} completedStages={0} chapters={[]} plan={plan} onRead={()=>begin()} onPreviewStage={begin}/>:screen==='reading'?<section className="demo-reader"><header><button aria-label="Voltar à trilha" onClick={()=>setScreen('trail')}><ArrowLeft/></button><h1>{reading.book}</h1><BookOpen aria-hidden="true"/></header>{error?<div role="alert"><p>{error}</p><button onClick={()=>setRetry(n=>n+1)}>Tentar novamente</button></div>:!chapter?<p role="status">Carregando leitura…</p>:<article ref={article} key={index} tabIndex={0} aria-label={`Leitura de ${chapter.book}`} onScroll={e=>{const el=e.currentTarget;if(el.scrollTop+el.clientHeight>=el.scrollHeight-40)setEnd(true)}}><h2 className="demo-reading-reference">{chapter.book} {chapter.chapter}</h2>{chapter.verses.map(v=><p key={v.number}><sup>{v.number}</sup> {v.text}</p>)}<p className="demo-end">✓ Fim da leitura</p></article>}
 {video?<aside className="demo-video"><strong>Panorama de {reading.book}</strong><p>Opcional · no aplicativo, o bônus de XP depende da validação.</p>{panorama&&<a href={panorama.url} target="_blank" rel="noopener noreferrer">Assistir ao panorama ↗</a>}<button onClick={()=>setVideo(false)}>Voltar à leitura</button></aside>:panorama&&<div className="demo-video-offer"><button onClick={()=>setVideo(true)}><Play size={18}/> Ver panorama?</button><span>Opcional</span></div>}
 <button className="demo-primary" disabled={!end} onClick={next}><Check size={22}/>{end?'Concluí a leitura':'Leia até o final'}</button></section>:<section className="demo-victory"><span aria-hidden="true">🌟</span><h1>Leitura concluída!</h1><p>Um dia de cada vez.</p><button className="demo-primary" onClick={()=>{setIndex(0);setStage(s=>Math.min(365,s+1));setScreen('trail')}}>{stage<365?'Próximo dia':'Voltar à trilha'}</button><small>Teste livre · sem registro de XP.</small></section>}
 <footer className="demo-footer">Demonstração · Almeida 1911, domínio público <a href="https://www.gutenberg.org/ebooks/62383" target="_blank" rel="noopener noreferrer">Fonte</a></footer></main>;
}
createRoot(document.getElementById('root')!).render(<Demo/>);
