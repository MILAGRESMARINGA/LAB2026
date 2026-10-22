import {useState} from "react";
import {CHAPTERS} from "../domain/canon";
import type {GameDay} from "../domain/game-plan";
import "./biblical-world-map.css";

type Props={stage:number|null;completedStages:number;chapters:readonly {chapter_id:string}[];plan?:ReadonlyArray<GameDay>;onRead?:()=>void};
const places=[
 {id:"rome",name:"Roma",x:180,y:130,note:"Cidade destinatária de Romanos, na Itália."},
 {id:"corinth",name:"Corinto",x:330,y:205,note:"Comunidade destinatária de 1 e 2 Coríntios, na Grécia."},
 {id:"ephesus",name:"Éfeso",x:435,y:220,note:"Cidade tradicionalmente associada aos destinatários de Efésios, na Ásia Menor (atual Turquia)."},
 {id:"haran",name:"Harã",x:660,y:215,note:"Ponto da viagem de Abrão em Gênesis 11–12."},
 {id:"canaan",name:"Canaã",x:565,y:315,note:"Região de muitas narrativas patriarcais; o lugar exato varia por capítulo."},
 {id:"jerusalem",name:"Jerusalém",x:560,y:375,note:"Cidade central em diversas narrativas bíblicas. Cada passagem exige seu próprio contexto."},
 {id:"egypt",name:"Egito",x:450,y:445,note:"Contexto da história de José e do início de Êxodo."},
 {id:"sinai",name:"Sinai",x:525,y:470,note:"Região tradicional do deserto. A localização exata do monte e da rota do Êxodo é debatida."},
 {id:"babylon",name:"Babilônia",x:815,y:340,note:"Contexto do exílio e de narrativas de Daniel; não representa todo capítulo profético."}
] as const;
function contextFor(book:string,chapter:number):string|null{
 if(book==="Efésios")return "ephesus";
 if(book==="Romanos")return "rome";
 if(book==="1 Coríntios"||book==="2 Coríntios")return "corinth";
 if(book==="Gênesis")return chapter>=39&&chapter<=47?"egypt":null;
 if(book==="Êxodo")return chapter<=12?"egypt":chapter>=19?"sinai":null;
 if(book==="Daniel"&&chapter<=6)return "babylon";
 return null;
}
export function BiblicalWorldMap({stage,completedStages,chapters,plan,onRead}:Props){
 const [zoom,setZoom]=useState(1),[selected,setSelected]=useState<string|null>(null);
 const [browse,setBrowse]=useState<number|null>(null);
 const browsing=browse!==null&&browse!==(stage??1);
 const viewed=plan?.[(browse??stage??1)-1];
 const refs=viewed?.chapters??chapters.flatMap(item=>{const c=CHAPTERS.find(c=>c.id===item.chapter_id);return c?[c]:[]});
 const active=new Set(refs.map(c=>contextFor(c.book,c.chapter)).filter(Boolean));
 const place=places.find(p=>p.id===selected);
 return <section className="atlas-journey" aria-label="Mapa da Jornada">
  <header><span className="eyebrow">A JORNADA · MUNDO BÍBLICO</span><h2>Uma história. Muitos caminhos.</h2><p>Etapa {stage??1} · {completedStages} concluídas. Explore o cenário da leitura.</p></header>
  <div className="atlas-tools"><button onClick={()=>setZoom(z=>Math.max(1,z-.25))} disabled={zoom===1} aria-label="Diminuir mapa">−</button><output>{Math.round(zoom*100)}%</output><button onClick={()=>setZoom(z=>Math.min(2,z+.25))} disabled={zoom===2} aria-label="Ampliar mapa">+</button><button onClick={()=>setZoom(1)}>Visão geral</button></div>
  <div className="atlas-viewport" tabIndex={0} aria-label="Mapa com rolagem horizontal e vertical ao ampliar">
   <svg viewBox="0 0 1000 600" style={{width:`${zoom*100}%`}} className="atlas-scene" role="group" aria-label="Mapa esquemático do Mediterrâneo, norte da África e Oriente Médio">
    <defs><linearGradient id="atlas-sea" x2="0" y2="1"><stop stopColor="#285967"/><stop offset="1" stopColor="#112f3c"/></linearGradient><linearGradient id="atlas-land" x2="0" y2="1"><stop stopColor="#c6c69b"/><stop offset="1" stopColor="#9a8057"/></linearGradient><filter id="atlas-shadow"><feDropShadow dx="0" dy="12" stdDeviation="3" floodOpacity=".45"/></filter></defs>
    <rect width="1000" height="600" rx="24" fill="url(#atlas-sea)"/>
    <g fill="url(#atlas-land)" stroke="#e2d4a5" strokeWidth="2" filter="url(#atlas-shadow)">
     <path d="M40 35H950V530L620 510 590 455 585 385 600 300 565 285 560 245 495 250 475 230 420 215 400 190 360 200 370 245 345 260 320 225 300 190 260 175 235 125 205 105 190 135 220 185 235 220 220 230 190 195 165 150 130 140 100 90 40 100Z"/>
     <path d="M40 330L170 325 280 360 380 365 420 400 490 415 510 440 510 500 550 525 575 505 540 460 555 440 595 465 625 550 950 570H40Z"/>
     <path d="M430 305l60 -8 10 12 -48 12Z"/><path d="M260 265l14 -8 8 28 -14 10Z"/>
    </g>
    <g fill="#f0dfae" opacity=".7">{[[110,75],[695,140],[720,170],[680,190],[600,255],[820,235],[500,490]].map(([x,y])=><path key={`${x}-${y}`} d={`M${x-13} ${y+10}l13 -26 14 26 -12 -7Z`}/>)}</g>
    <g fill="#f0e7c9" fontSize="15" letterSpacing="4"><text x="80" y="65">EUROPA</text><text x="90" y="500">NORTE DA ÁFRICA</text><text x="655" y="90">ORIENTE MÉDIO</text></g>
    <text x="260" y="320" fill="#9ccad0" fontSize="16" letterSpacing="3">MAR MEDITERRÂNEO</text>
    {places.map(p=><g key={p.id} role="button" tabIndex={0} aria-label={`Explorar ${p.name}${active.has(p.id)?", relacionado à etapa":""}`} onClick={()=>setSelected(p.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(p.id)}}} className="atlas-pin" transform={`translate(${p.x} ${p.y})`}>
     <ellipse cy="13" rx="19" ry="8" fill="#102b31" opacity=".6"/><circle r="16" fill={active.has(p.id)?"#b4e44d":"#efdfb4"} stroke={selected===p.id?"#fff":"#6e5b3c"} strokeWidth="4"/><text textAnchor="middle" y="5" fill="#243a31" fontSize="16">{active.has(p.id)?"●":"·"}</text><rect x="-51" y="24" width="102" height="23" rx="6" fill="#102f39"/><text textAnchor="middle" y="40" fill="#f8efdc" fontSize="14">{p.name}</text>
    </g>)}
   </svg>
  </div>
  <div className="atlas-context" aria-live="polite">{place?<><h3>{place.name}</h3><p>{place.note}</p><p>{refs.filter(c=>contextFor(c.book,c.chapter)===place.id).map(c=>`${c.book} ${c.chapter}`).join(" · ")||"Local disponível para exploração do contexto bíblico."}</p></>:<><h3>Toque em uma cidade</h3><p>Os pontos verdes indicam relações revisadas com a etapa atual. Outros locais podem ser explorados livremente.</p></>}{active.size===0&&<p>Esta etapa não tem localização precisa cadastrada. Não atribuímos um lugar por suposição.</p>}<small>Mapa esquemático 2.5D, sem escala. Os pontos das cartas indicam destinatários, não necessariamente onde foram escritas. Não representam uma viagem contínua do leitor.</small></div>
  {plan&&<section className="atlas-stage-road" aria-label="Estrada das etapas de leitura"><h3>Seu caminho · {plan.length} etapas</h3><label>Explorar etapa {browse??stage??1}<input type="range" min="1" max={plan.length} value={browse??stage??1} onChange={e=>{setBrowse(Number(e.target.value));setSelected(null)}}/></label><div className="atlas-stops">{plan.slice(Math.max(0,(browse??stage??1)-3),Math.min(plan.length,(browse??stage??1)+2)).map(day=><button key={day.day} aria-pressed={day.day===(browse??stage??1)} onClick={()=>{setBrowse(day.day);setSelected(null)}}><span>{day.day<=completedStages?"✓":day.day===(stage??1)?"●":"○"}</span>Etapa {day.day}<small>{day.day<=completedStages?"Concluída":day.day===(stage??1)?"Atual":"Prévia"}</small></button>)}</div><p>{refs.map(c=>`${c.book} ${c.chapter}`).join(" · ")}</p>{browsing?<button onClick={()=>{setBrowse(null);setSelected(null)}}>Voltar à etapa atual</button>:onRead?<button onClick={onRead}>Abrir leitura da etapa atual</button>:<a href="#journey-current-reading">Ir para a leitura atual</a>}<small>A exploração do mapa não ativa etapas nem registra XP. A leitura segue a liberação da sua Jornada.</small></section>}
 </section>;
}
