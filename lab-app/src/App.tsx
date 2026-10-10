import {useMemo,useState} from "react";
import {BookOpen,CheckCircle2,CalendarDays,ShieldCheck} from "lucide-react";
import {createAnnualPlan,dayOfYear,verifyAnnualPlan} from "./domain/plan";
import {CANON,totalChapters} from "./domain/canon";
export default function App(){
 const year=new Date().getFullYear();
 const plan=useMemo(()=>createAnnualPlan(year),[year]);
 const today=plan[dayOfYear(new Date())-1];
 const [done,setDone]=useState<string[]>([]);
 const progress=Math.round(done.length/today.chapters.length*100);
 return <main className="shell">
  <header><div className="brand"><BookOpen size={25}/><span>LAB <small>LEITURA ANUAL DA BÍBLIA</small></span></div><span className="year"><CalendarDays size={16}/>{year}</span></header>
  <section className="hero"><span className="eyebrow">SUA JORNADA NA PALAVRA</span><h1>Um dia de cada vez.<br/><em>A Bíblia toda em um ano.</em></h1><p>Conheça as Escrituras, desenvolva constância e acompanhe sua jornada de leitura.</p><div className="stats"><div><strong>{CANON.length}</strong><span>Livros</span></div><div><strong>{totalChapters.toLocaleString("pt-BR")}</strong><span>Capítulos</span></div><div><strong>{plan.length}</strong><span>Dias</span></div></div></section>
  <section className="panel"><div className="section-head"><div><span className="eyebrow">PLANO ANUAL</span><h2>Leitura de hoje</h2><p>Dia {today.day} de {plan.length}</p></div><span className="chip">Protótipo local</span></div>
  <div className="progress-line"><span>Progresso de hoje</span><strong>{progress}%</strong></div><div className="track"><div style={{width:`${progress}%`}}/></div>
  <div className="readings">{today.chapters.map(ch=><label className="reading" key={ch.id}><div className="reading-title"><BookOpen size={18}/><span>{ch.book} <b>{ch.chapter}</b></span><small>{ch.testament}</small></div><input type="checkbox" checked={done.includes(ch.id)} onChange={e=>setDone(old=>e.target.checked?[...old,ch.id]:old.filter(id=>id!==ch.id))}/></label>)}</div>
  {progress===100&&<p className="complete"><CheckCircle2 size={18}/> Leitura do dia concluída!</p>}
  <p className="notice"><ShieldCheck size={16}/> {verifyAnnualPlan(plan)?"Plano validado: todos os capítulos contemplados.":"Erro na cobertura do plano."} Marcações ainda não são salvas no servidor.</p></section>
  <footer>LAB · Leitura bíblica integral · {year}</footer>
 </main>;
}
