import {useEffect,useMemo,useState} from "react";
import {BookOpen,CheckCircle2,CalendarDays,ShieldCheck,LogIn,LogOut} from "lucide-react";
import {createParallelPlan,verifyParallelPlan} from "./domain/parallel-plan";
import {dayOfYear} from "./domain/plan";
import {CANON,totalChapters} from "./domain/canon";
import {supabase} from "./lib/supabase";
import {getCompletedChapters,setChapterCompleted} from "./features/progress";
import {signIn,signUp,signOut} from "./features/auth";
import {achievements,chapterPoints} from "./domain/gamification";
export default function App(){
 const year=new Date().getFullYear();
 const plan=useMemo(()=>createParallelPlan(year),[year]);
 const today=plan[dayOfYear(new Date())-1];
 const chapters=[...today.old,...today.psalms,...today.newTestament];
 const [done,setDone]=useState<string[]>([]);
 const [user,setUser]=useState<string|null>(null);
 const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!supabase)return;
  let active=true;
  const refresh=async()=>{const {data:{user}}=await supabase.auth.getUser();if(!active)return;setUser(user?.email??null);if(user){try{setDone(await getCompletedChapters(year))}catch(e){setMessage(String(e))}}else setDone([])};
  void refresh();
  const {data:{subscription}}=supabase.auth.onAuthStateChange(()=>{void refresh()});
  return()=>{active=false;subscription.unsubscribe()};
 },[year]);
 const progress=chapters.length?Math.round(chapters.filter(ch=>done.includes(ch.id)).length/chapters.length*100):100;
 const toggle=async(id:string,checked:boolean)=>{
  if(!user){setMessage("Entre na sua conta para registrar a leitura.");return}
  setBusy(true);setMessage("");
  try{await setChapterCompleted(year,id,checked);setDone(old=>checked?[...new Set([...old,id])]:old.filter(x=>x!==id))}
  catch(e){setMessage(e instanceof Error?e.message:"Erro ao salvar leitura")}
  finally{setBusy(false)}
 };
 const auth=async(mode:"in"|"up")=>{setBusy(true);setMessage("");try{if(mode==="in")await signIn(email,password);else{await signUp(email,password);setMessage("Cadastro solicitado. Verifique seu e-mail, se necessário.")}}catch(e){setMessage(e instanceof Error?e.message:"Falha de autenticação")}finally{setBusy(false)}};
 const sections=[{title:"Antigo Testamento",data:today.old},{title:"Salmos",data:today.psalms},{title:"Novo Testamento",data:today.newTestament}];
 return <main className="shell">
  <header><div className="brand"><BookOpen size={25}/><span>LAB <small>LEITURA ANUAL DA BÍBLIA</small></span></div><span className="year"><CalendarDays size={16}/>{year}</span></header>
  <section className="hero"><span className="eyebrow">SUA JORNADA NA PALAVRA</span><h1>Um dia de cada vez.<br/><em>A Bíblia toda em um ano.</em></h1><p>Leia as Escrituras, desenvolva constância e acompanhe sua jornada.</p><div className="stats"><div><strong>{CANON.length}</strong><span>Livros</span></div><div><strong>{totalChapters.toLocaleString("pt-BR")}</strong><span>Capítulos</span></div><div><strong>{plan.length}</strong><span>Dias</span></div></div></section>
  <section className="panel"><div className="section-head"><div><span className="eyebrow">PLANO ANUAL</span><h2>Leitura de hoje</h2><p>Dia {today.day} de {plan.length}</p></div><span className="chip">{user?"Conectado":"Acesso livre"}</span></div>
  {supabase&&!user&&<form className="auth" onSubmit={e=>{e.preventDefault();void auth("in")}}><input aria-label="E-mail" type="email" placeholder="E-mail" required value={email} onChange={e=>setEmail(e.target.value)}/><input aria-label="Senha" type="password" placeholder="Senha" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}/><button disabled={busy} type="submit"><LogIn size={15}/> Entrar</button><button type="button" disabled={busy} onClick={()=>void auth("up")}>Criar conta</button></form>}
  {user&&<div className="auth"><span>{user}</span><button onClick={()=>void signOut()}><LogOut size={15}/> Sair</button></div>}
  <div className="progress-line"><span>Progresso de hoje</span><strong>{progress}%</strong></div><div className="track"><div style={{width:`${progress}%`}}/></div>
  {sections.map(section=><div key={section.title}><h3>{section.title}</h3>{section.data.length===0?<p className="empty">Sem capítulo nesta seção hoje.</p>:section.data.map(ch=><label className="reading" key={ch.id}><div className="reading-title"><BookOpen size={18}/><span>{ch.book} <b>{ch.chapter}</b></span></div><input type="checkbox" disabled={busy||!user} checked={done.includes(ch.id)} onChange={e=>void toggle(ch.id,e.target.checked)}/></label>)}</div>)}
  {progress===100&&<p className="complete"><CheckCircle2 size={18}/> Leitura do dia concluída!</p>}
  {message&&<p role="status" className="notice">{message}</p>}
  {user&&<p className="notice">Pontos por capítulos confirmados: {chapterPoints(done.map(chapterId=>({chapterId,completedAt:""})))} · Conquistas: {achievements(done.map(chapterId=>({chapterId,completedAt:""}))).filter(a=>a.earned).map(a=>a.label).join(", ")||"Nenhuma"}</p>}
  <p className="notice"><ShieldCheck size={16}/> {verifyParallelPlan(plan)?"Plano anual validado: 1.189 capítulos sem duplicação.":"Erro de cobertura."} {supabase?"Progresso salvo apenas após autenticação.":"Configure o Supabase do LAB para salvar seu progresso."}</p></section>
  <footer>LAB · Leitura bíblica integral · {year}</footer>
 </main>;
}