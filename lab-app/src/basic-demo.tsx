import React,{useState,useRef,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen,Check,ArrowLeft,Play} from 'lucide-react';
import {BasicJourney} from './components/BasicJourney';
import {createNextGamePlan} from './domain/game-plan-next';
import {getBibleProjectVideoForChapter} from './domain/bibleproject';
import readings from './domain/demo-reading.json';
import './basic-demo.css';
const plan=createNextGamePlan(365).stages,refs=['1:1','19:1','43:1'] as const;
function Demo(){
 const [screen,setScreen]=useState<'trail'|'reading'|'done'>('trail'),[index,setIndex]=useState(0),[end,setEnd]=useState(false),[video,setVideo]=useState(false),[help,setHelp]=useState(false);
 const article=useRef<HTMLElement>(null);
 useEffect(()=>{const el=article.current;if(screen==='reading'&&el&&el.scrollHeight<=el.clientHeight+32)setEnd(true)},[screen,index]);
 const chapter=readings[refs[index]],panorama=getBibleProjectVideoForChapter(chapter.book,1);
 const begin=()=>{setIndex(0);setEnd(false);setVideo(false);setScreen('reading')};
 const next=()=>{if(index===refs.length-1)setScreen('done');else{setIndex(i=>i+1);setEnd(false);setVideo(false)}};
 return <main className="public-demo"><header className="demo-top"><strong>LAB<span>GAME</span></strong><button type="button" aria-label="Sobre esta demonstração" onClick={()=>setHelp(v=>!v)}>ⓘ</button></header>
 {help&&<aside className="demo-note">Demonstração pública · sem cadastro. Você pode testar a primeira leitura do plano intercalado. Nenhum dado ou XP é registrado.<button onClick={()=>setHelp(false)}>Entendi</button></aside>}
 {screen==='trail'?<BasicJourney stage={1} completedStages={0} chapters={[]} plan={plan} onRead={begin}/>:screen==='reading'?<section className="demo-reader"><header><button aria-label="Voltar à trilha" onClick={()=>setScreen('trail')}><ArrowLeft/></button><h1>{chapter.book}</h1><BookOpen aria-hidden="true"/></header><article ref={article} key={index} tabIndex={0} aria-label={`Leitura de ${chapter.book}`} onScroll={e=>{const el=e.currentTarget;if(el.scrollTop+el.clientHeight>=el.scrollHeight-40)setEnd(true)}}><h2 className="demo-reading-reference">{chapter.book} 1</h2>{chapter.verses.map(v=><p key={v.number}><sup>{v.number}</sup> {v.text}</p>)}<p className="demo-end">✓ Fim da leitura</p></article>
 {video?<aside className="demo-video"><strong>Panorama de {chapter.book}</strong><p>Opcional · no aplicativo, o bônus de XP depende da validação.</p>{panorama&&<a href={panorama.url} target="_blank" rel="noopener noreferrer">Assistir ao panorama ↗</a>}<button onClick={()=>setVideo(false)}>Voltar à leitura</button></aside>:panorama&&<div className="demo-video-offer"><button onClick={()=>setVideo(true)}><Play size={18}/> Ver panorama?</button><span>Opcional</span></div>}
 <button className="demo-primary" disabled={!end} onClick={next}><Check size={22}/>{end?'Concluí a leitura':'Leia até o final'}</button></section>:<section className="demo-victory"><span aria-hidden="true">🌟</span><h1>Leitura concluída!</h1><p>Um dia de cada vez.</p><button className="demo-primary" onClick={()=>setScreen('trail')}>Voltar à trilha</button><small>Fim da demonstração · sem registro de XP.</small></section>}
 <footer className="demo-footer">Demonstração · Almeida 1911, domínio público <a href="https://www.gutenberg.org/ebooks/62383" target="_blank" rel="noopener noreferrer">Fonte</a></footer></main>;
}
createRoot(document.getElementById('root')!).render(<Demo/>);
