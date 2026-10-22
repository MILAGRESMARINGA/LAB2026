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
 const focusPlace=place??places.find(p=>active.has(p.id));
 const nearby=plan?.slice(Math.max(0,(browse??stage??1)-3),Math.min(plan.length,(browse??stage??1)+2))??[];
 const related=place?plan?.filter(day=>day.chapters.some(c=>contextFor(c.book,c.chapter)===place.id))??[]:[];
 const trail="M100 557 C170 515 220 575 290 537 S410 512 470 543 S605 573 680 534 S805 505 910 550";
 return <section className="atlas-journey" aria-label="Mapa da Jornada">
  <header><span className="eyebrow">A JORNADA · MUNDO BÍBLICO</span><h2>Uma história. Muitos caminhos.</h2><p>Etapa {stage??1} · {completedStages} concluídas. Explore o cenário da leitura.</p></header>
  <div className="atlas-tools"><button onClick={()=>setZoom(z=>Math.max(1,z-.25))} disabled={zoom===1} aria-label="Diminuir mapa">−</button><output>{Math.round(zoom*100)}%</output><button onClick={()=>setZoom(z=>Math.min(2,z+.25))} disabled={zoom===2} aria-label="Ampliar mapa">+</button><button onClick={()=>setZoom(1)}>Visão geral</button></div>
  <div className="atlas-viewport" tabIndex={0} aria-label="Mapa com rolagem horizontal e vertical ao ampliar">
   <svg viewBox="0 0 1000 600" style={{width:`${zoom*100}%`}} className="atlas-scene" role="group" aria-label="Mapa esquemático do Mediterrâneo, norte da África e Oriente Médio">
    <defs><linearGradient id="atlas-sea" x2="0" y2="1"><stop stopColor="#285967"/><stop offset="1" stopColor="#112f3c"/></linearGradient><linearGradient id="atlas-land" x2="0" y2="1"><stop stopColor="#c6c69b"/><stop offset="1" stopColor="#9a8057"/></linearGradient><pattern id="atlas-water" width="65" height="44" patternUnits="userSpaceOnUse"><path d="M6 22q12 -6 24 0t24 0" fill="none" stroke="#99d2cb" strokeOpacity=".12" strokeWidth="2"/></pattern><filter id="atlas-shadow"><feDropShadow dx="0" dy="12" stdDeviation="3" floodOpacity=".45"/></filter></defs>
    <rect width="1000" height="600" rx="24" fill="url(#atlas-sea)"/>
    <rect width="1000" height="600" fill="url(#atlas-water)"/>
    <g fill="url(#atlas-land)" stroke="#e2d4a5" strokeWidth="2" filter="url(#atlas-shadow)">
     <path d="M40 35H950V530L620 510 590 455 585 385 600 300 565 285 560 245 495 250 475 230 420 215 400 190 360 200 370 245 345 260 320 225 300 190 260 175 235 125 205 105 190 135 220 185 235 220 220 230 190 195 165 150 130 140 100 90 40 100Z"/>
     <path d="M40 330L170 325 280 360 380 365 420 400 490 415 510 440 510 500 550 525 575 505 540 460 555 440 595 465 625 550 950 570H40Z"/>
     <path d="M430 305l60 -8 10 12 -48 12Z"/><path d="M260 265l14 -8 8 28 -14 10Z"/>
    </g>
    <g aria-hidden="true">
     <path d="M451 565C430 535 455 510 450 490S425 458 449 424" fill="none" stroke="#77bcc1" strokeWidth="7"/>
     <path d="M778 210Q750 240 785 280T832 370M815 213Q790 250 825 290T864 381" fill="none" stroke="#77bcc1" strokeWidth="4" opacity=".8"/>
     {[[110,75],[695,140],[720,170],[680,190],[600,255],[820,235],[500,490],[635,165],[650,145],[735,150],[710,115]].map(([x,y])=><g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><ellipse cy="14" rx="23" ry="8" fill="#514c38" opacity=".2"/><path d="M-24 14L0 -28 25 14Z" fill="#827c61"/><path d="M0 -28L25 14 3 5Z" fill="#555d50"/><path d="M-8 -14L0 -28 9 -13 2 -16 -2 -11Z" fill="#eee3c4"/></g>)}
     {[[132,105],[150,114],[310,140],[380,175],[405,168],[620,285],[633,277],[553,300],[570,290]].map(([x,y])=><g key={`tree-${x}`} transform={`translate(${x} ${y})`}><ellipse cy="11" rx="10" ry="4" fill="#344e3c" opacity=".25"/><path d="M0 10V-7" stroke="#67543a" strokeWidth="4"/><path d="M-11 1L0 -25 11 1Z" fill="#526e48"/><path d="M0 -25L11 1H0Z" fill="#365940"/></g>)}
     <g transform="translate(105 235) rotate(-12)"><path d="M-22 13Q0 30 25 12Z" fill="#b69361"/><path d="M0 13V-29" stroke="#e6d6ae" strokeWidth="3"/><path d="M-3 -27L-23 8H-3Z" fill="#e9dfbd"/><path d="M3 -21L20 8H3Z" fill="#c3b687"/></g>
     <g transform="translate(900 110)" fill="none" stroke="#e0cc91"><circle r="30" opacity=".5"/><path d="M0 -40L8 -8 0 40 -8 8Z" fill="#e0cc91"/><path d="M-35 0L-7 -7 35 0 7 7Z"/><text y="-47" textAnchor="middle" fill="#e0cc91" stroke="none" fontSize="14">N</text></g>
    </g>
    <g fill="#f0e7c9" fontSize="15" letterSpacing="4"><text x="80" y="65">EUROPA</text><text x="90" y="500">NORTE DA ÁFRICA</text><text x="655" y="90">ORIENTE MÉDIO</text></g>
    <text x="260" y="320" fill="#9ccad0" fontSize="16" letterSpacing="3">MAR MEDITERRÂNEO</text>
    <g aria-hidden="true" fill="none" strokeLinecap="round">
     <path d={trail} stroke="#081f29" strokeWidth="25" opacity=".5" transform="translate(0 7)"/>
     <path d={trail} stroke="#8f7448" strokeWidth="23"/>
     <path d={trail} stroke="#e8cf94" strokeWidth="17"/>
     <path d={trail} stroke="#a78d5d" strokeWidth="2" strokeDasharray="2 12"/>
    </g>
    <text x="50" y="590" fill="#e3d7b2" fontSize="12" letterSpacing="2">TRILHA DAS ETAPAS · PERCURSO SIMBÓLICO</text>
    {nearby.map((day,i)=>{const x=130+i*180,y=[547,530,548,545,533][i];return <g key={`stop-${day.day}`} role="button" tabIndex={0} aria-label={`Explorar etapa ${day.day} no caminho`} className="atlas-pin" transform={`translate(${x} ${y})`} onClick={()=>{setBrowse(day.day);setSelected(null)}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setBrowse(day.day);setSelected(null)}}}><ellipse cy="10" rx="24" ry="10" fill="#102b31"/><circle r="21" fill={day.day<=completedStages?"#81b96a":day.day===(browse??stage??1)?"#b4e44d":"#d9c496"} stroke="#fff0ca" strokeWidth="3"/><text textAnchor="middle" y="5" fill="#243a31" fontSize="14" fontWeight="700">{day.day<=completedStages?"✓":day.day}</text></g>})}
    {places.map(p=><g key={p.id} role="button" tabIndex={0} aria-label={`Explorar ${p.name}${active.has(p.id)?", relacionado à etapa":""}`} onClick={()=>setSelected(p.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(p.id)}}} className="atlas-pin" transform={`translate(${p.x} ${p.y})`}>
     <ellipse cy="13" rx="24" ry="10" fill="#102b31" opacity=".6"/>{active.has(p.id)&&<circle className="atlas-active-ring" r="26" fill="none" stroke="#b4e44d" strokeWidth="2"/>}<path d="M-15 -10V-30H-7V-23H0V-35H7V-23H15V-10" fill="#d9c59a" stroke="#68593d" strokeWidth="2"/><circle r="16" fill={active.has(p.id)?"#b4e44d":"#efdfb4"} stroke={selected===p.id?"#fff":"#6e5b3c"} strokeWidth="4"/><text textAnchor="middle" y="5" fill="#243a31" fontSize="16">{active.has(p.id)?"●":"·"}</text><rect x="-51" y="24" width="102" height="23" rx="6" fill="#102f39"/><text textAnchor="middle" y="40" fill="#f8efdc" fontSize="14">{p.name}</text>
    </g>)}
   </svg>
  </div>
  <div className="atlas-map-status"><span>◉ {focusPlace?.name??"Mundo bíblico"}</span><span>Etapa {browse??stage??1} / {plan?.length??365}</span></div>
  <div className="atlas-context" aria-live="polite">{place?<><h3>{place.name}</h3><p>{place.note}</p><p>{refs.filter(c=>contextFor(c.book,c.chapter)===place.id).map(c=>`${c.book} ${c.chapter}`).join(" · ")||"Local disponível para exploração do contexto bíblico."}</p></>:<><h3>Toque em uma cidade</h3><p>Os pontos verdes indicam relações revisadas com a etapa atual. Outros locais podem ser explorados livremente.</p></>}{place&&related.length>0&&<div className="atlas-related"><strong>Etapas neste contexto</strong><div>{related.slice(0,12).map(day=><button key={day.day} onClick={()=>setBrowse(day.day)} aria-pressed={day.day===(browse??stage??1)}>Etapa {day.day}</button>)}</div>{related.length>12&&<small>As demais etapas estão disponíveis no seletor da Jornada.</small>}</div>}{active.size===0&&<p>Esta etapa não tem localização precisa cadastrada. Não atribuímos um lugar por suposição.</p>}<small>Mapa esquemático 2.5D, sem escala. Os pontos das cartas indicam destinatários, não necessariamente onde foram escritas. Não representam uma viagem contínua do leitor.</small></div>
  {plan&&<section className="atlas-stage-road" aria-label="Estrada das etapas de leitura"><h3>Seu caminho · {plan.length} etapas</h3><label>Explorar etapa {browse??stage??1}<input type="range" min="1" max={plan.length} value={browse??stage??1} onChange={e=>{setBrowse(Number(e.target.value));setSelected(null)}}/></label><div className="atlas-stops">{plan.slice(Math.max(0,(browse??stage??1)-3),Math.min(plan.length,(browse??stage??1)+2)).map(day=><button key={day.day} aria-pressed={day.day===(browse??stage??1)} onClick={()=>{setBrowse(day.day);setSelected(null)}}><span>{day.day<=completedStages?"✓":day.day===(stage??1)?"●":"○"}</span>Etapa {day.day}<small>{day.day<=completedStages?"Concluída":day.day===(stage??1)?"Atual":"Prévia"}</small></button>)}</div><p>{refs.map(c=>`${c.book} ${c.chapter}`).join(" · ")}</p>{browsing?<button onClick={()=>{setBrowse(null);setSelected(null)}}>Voltar à etapa atual</button>:onRead?<button onClick={onRead}>Abrir leitura da etapa atual</button>:<a href="#journey-current-reading">Ir para a leitura atual</a>}<small>A exploração do mapa não ativa etapas nem registra XP. A leitura segue a liberação da sua Jornada.</small></section>}
 </section>;
}
