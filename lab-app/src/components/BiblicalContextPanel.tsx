import {useState} from 'react';
import {ANCIENT_MEASURES,CONTEXT_SOURCES,contextForChapter,convertAncientMeasure} from '../domain/biblical-context';

/** Optional reference tools. No callbacks modify reading, time, progress or XP. */
export function BiblicalContextPanel({chapterId}:{chapterId:string}){
 const [measureId,setMeasureId]=useState('cubit');
 const [quantity,setQuantity]=useState('1');
 const {timeline,atlas}=contextForChapter(chapterId);
 const measure=ANCIENT_MEASURES.find(item=>item.id===measureId)!;
 const result=quantity.trim()===''?null:convertAncientMeasure(measureId,Number(quantity));
 const format=(value:number)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(value);
 return <details className="biblical-context-panel"><summary>Contexto bíblico · tempo, lugares e medidas</summary>
 <p>Consulta opcional. As referências ajudam a leitura e não alteram seu avanço ou XP.</p>
 {timeline.length>0&&<section aria-label="Linha do tempo contextual"><h3>Reinos, profetas e impérios</h3><p>Panorama do livro: os períodos abaixo podem abranger capítulos diferentes. Não atribuímos uma única data ao capítulo atual.</p>{timeline.map(item=><article key={item.id}><h4>{item.period}</h4><dl><dt>Reino / comunidade</dt><dd>{item.kingdom}</dd><dt>Governantes</dt><dd>{item.rulers}</dd><dt>Profetas</dt><dd>{item.prophets}</dd><dt>Domínio / contexto político</dt><dd>{item.empire}</dd></dl><p>Conferir: {item.references.join(' · ')}</p></article>)}</section>}
 {atlas.length>0&&<section aria-label="Referências do atlas"><h3>Lugares e plantas para este livro</h3><p>Catálogo de referências geográficas. As imagens cartográficas ainda não estão disponíveis nesta edição.</p>{atlas.map(item=><article key={item.id}><h4>{item.title}</h4><p>{item.note}</p><small>Conferir: {item.references.join(' · ')}</small></article>)}</section>}
 <section aria-label="Conversor de medidas bíblicas"><h3>Medidas antigas: equivalências aproximadas</h3><label>Medida <select value={measureId} onChange={event=>setMeasureId(event.target.value)}>{ANCIENT_MEASURES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Quantidade <input type="number" min="0" max="1000000" step="any" value={quantity} onChange={event=>setQuantity(event.target.value)}/></label><p role="status">{result?`≈ ${format(result.minimum)}${result.maximum!==result.minimum?` a ${format(result.maximum)}`:''} ${result.unit}`:'Informe uma quantidade entre zero e um milhão.'}</p><p>{measure.context} Referência: {measure.reference}.</p><p>Os padrões variavam entre épocas e regiões. Estes intervalos não são medições exatas e moedas antigas não recebem cotação moderna.</p></section>
 <details><summary>Fontes das equivalências</summary><ul>{CONTEXT_SOURCES.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul></details>
 </details>;
}
