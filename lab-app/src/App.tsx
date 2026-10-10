import {useEffect,useMemo,useState} from "react";
import {BookOpen,CheckCircle2,CalendarDays,ShieldCheck,LogIn,LogOut,Trophy,Users,UserRound,ChevronLeft,ChevronRight,Flame} from "lucide-react";
import {createParallelPlan,verifyParallelPlan} from "./domain/parallel-plan";
import {dayOfYear} from "./domain/plan";
import {chaptersForDay,formatReadingDate} from "./domain/calendar";
import {readingStreak,completedDayCount} from "./domain/streaks";
import {CANON,totalChapters} from "./domain/canon";
import {supabase} from "./lib/supabase";
import {getCompletedChapters,setChapterCompleted} from "./features/progress";
import {signIn,signUp,signOut} from "./features/auth";
import {achievements,chapterPoints} from "./domain/gamification";
export default function App(){
 const year=new Date().getFullYear();
 const plan=useMemo(()=>createParallelPlan(year),[year]);
 const currentDay=dayOfYear(new Date());
 const [selectedDay,setSelectedDay]=useState(currentDay);
 const [tab,setTab]=useState<"today"|"calendar"|"achievements"|"groups"|"profile">("today");
 const today=plan[selectedDay-1];
 const chapters=chaptersForDay(today);
 const [done,setDone]=useState<string[]>([]);
 const completed=new Set(done);
 const planDays=plan.map(d=>({day:d.day,chapters:chaptersForDay(d)}));
 const annualProgress=Math.round(done.length/totalChapters*100);
 const streak=readingStreak(completed,planDays,currentDay);
 const finishedDays=completedDayCount(completed,planDays);
 const [user,setUser]=useState<string|null>(null);
 const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const client=supabase;if(!client)return;
  let active=true;
  const refresh=async()=>{const {data:{user}}=await client.auth.getUser();if(!active)return;setUser(user?.email??null);if(user){try{setDone(await getCompletedChapters(year))}catch(e){setMessage(String(e))}}else setDone([])};
  void refresh();
  const {data:{subscription}}=client.auth.onAuthStateChange(()=>{void refresh()});
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
 const tabs=[{id:"today",label:"Hoje",icon:BookOpen},{id:"calendar",label:"Calendário",icon:CalendarDays},{id:"achievements",label:"Conquistas",icon:Trophy},{id:"groups",label:"Grupos",icon:Users},{id:"profile",label:"Perfil",icon:UserRound}] as const;
 const dayComplete=(day:number)=>chaptersForDay(plan[day-1]).every(ch=>completed.has(ch.id));
 const openDay=(day:number)=>{setSelectedDay(day);setTab("today")};
 return <main className="shell">
  <header><div className="brand"><BookOpen size={25}/><span>LAB <small>LEITURA ANUAL DA BÍBLIA</small></span></div><span className="year"><CalendarDays size={16}/>{year}</span></header>
  <nav className="app-nav" aria-label="Navegação principal">{tabs.map(t=><button key={t.id} type="button" className={tab===t.id?"active":""} onClick={()=>setTab(t.id)}><t.icon size={17}/><span>{t.label}</span></button>)}</nav>
  {tab==="today"&&<><section className="hero"><span className="eyebrow">SUA JORNADA NA PALAVRA</span><h1>Um dia de cada vez.<br/><em>A Bíblia toda em um ano.</em></h1><p>Leia as Escrituras, desenvolva constância e acompanhe sua jornada.</p><div className="stats"><div><strong>{CANON.length}</strong><span>Livros</span></div><div><strong>{totalChapters.toLocaleString("pt-BR")}</strong><span>Capítulos</span></div><div><strong>{plan.length}</strong><span>Dias</span></div></div></section>
  <section className="panel"><div className="section-head"><div><span className="eyebrow">PLANO ANUAL</span><h2>Leitura de hoje</h2><p>Dia {today.day} de {plan.length} · {formatReadingDate(year,today.day)}</p></div><span className="chip">{user?"Conectado":"Acesso livre"}</span></div>
  {supabase&&!user&&<form className="auth" onSubmit={e=>{e.preventDefault();void auth("in")}}><input aria-label="E-mail" type="email" placeholder="E-mail" required value={email} onChange={e=>setEmail(e.target.value)}/><input aria-label="Senha" type="password" placeholder="Senha" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}/><button disabled={busy} type="submit"><LogIn size={15}/> Entrar</button><button type="button" disabled={busy} onClick={()=>void auth("up")}>Criar conta</button></form>}
  {user&&<div className="auth"><span>{user}</span><button onClick={()=>void signOut()}><LogOut size={15}/> Sair</button></div>}
  <div className="day-switch"><button type="button" disabled={selectedDay<=1} onClick={()=>setSelectedDay(d=>d-1)} aria-label="Dia anterior"><ChevronLeft size={18}/></button><strong>Dia {selectedDay}</strong><button type="button" disabled={selectedDay>=plan.length} onClick={()=>setSelectedDay(d=>d+1)} aria-label="Próximo dia"><ChevronRight size={18}/></button></div>
  <div className="progress-line"><span>Progresso de hoje</span><strong>{progress}%</strong></div><div className="track"><div style={{width:`${progress}%`}}/></div>
  {sections.map(section=><div key={section.title}><h3>{section.title}</h3>{section.data.length===0?<p className="empty">Sem capítulo nesta seção hoje.</p>:section.data.map(ch=><label className="reading" key={ch.id}><div className="reading-title"><BookOpen size={18}/><span>{ch.book} <b>{ch.chapter}</b></span></div><input type="checkbox" disabled={busy||!user} checked={done.includes(ch.id)} onChange={e=>void toggle(ch.id,e.target.checked)}/></label>)}</div>)}
  {progress===100&&<p className="complete"><CheckCircle2 size={18}/> Leitura do dia concluída!</p>}
  {message&&<p role="status" className="notice">{message}</p>}
  {user&&<p className="notice">Pontos por capítulos confirmados: {chapterPoints(done.map(chapterId=>({chapterId,completedAt:""})))} · Conquistas: {achievements(done.map(chapterId=>({chapterId,completedAt:""}))).filter(a=>a.earned).map(a=>a.label).join(", ")||"Nenhuma"}</p>}
  <p className="notice"><ShieldCheck size={16}/> {verifyParallelPlan(plan)?"Plano anual validado: 1.189 capítulos sem duplicação.":"Erro de cobertura."} {supabase?"Progresso salvo apenas após autenticação.":"Configure o Supabase do LAB para salvar seu progresso."}</p></section>
  </>}
  {tab==="calendar"&&<section className="panel"><span className="eyebrow">SUA JORNADA</span><h2>Calendário de leitura</h2><p className="muted">Selecione um dia para abrir suas leituras. Dias completos aparecem marcados.</p><div className="calendar-grid">{plan.map(d=><button type="button" key={d.day} className={dayComplete(d.day)?"finished":d.day===currentDay?"current":""} onClick={()=>openDay(d.day)} aria-label={`Abrir dia ${d.day}`}>{d.day}</button>)}</div></section>}
  {tab==="achievements"&&<section className="panel"><span className="eyebrow">CONSTÂNCIA E PROGRESSO</span><h2>Suas conquistas</h2><div className="metric-grid"><div><Trophy/><strong>{done.length*10}</strong><span>XP</span></div><div><Flame/><strong>{streak}</strong><span>Dias seguidos</span></div><div><CheckCircle2/><strong>{finishedDays}</strong><span>Dias completos</span></div></div><div className="progress-line"><span>Progresso anual</span><strong>{annualProgress}%</strong></div><div className="track"><div style={{width:`${annualProgress}%`}}/></div>{achievements(done.map(chapterId=>({chapterId,completedAt:""}))).map(a=><div className="achievement" key={a.id}><Trophy size={19}/><span>{a.label}</span><strong>{a.earned?"Conquistada":"Pendente"}</strong></div>)}<p className="muted">A pontuação reconhece a constância, não mede espiritualidade.</p></section>}
  {tab==="groups"&&<section className="panel"><span className="eyebrow">COMUNIDADE LAB</span><h2>Grupos de leitura</h2><p className="muted">Acompanhe a Bíblia em comunidade. Convites, gestão de líderes e rankings privados serão habilitados após a revisão das permissões.</p><div className="feature-note"><Users size={25}/><div><strong>Em preparação</strong><p>Os dados dos participantes não são públicos.</p></div></div></section>}
  {tab==="profile"&&<section className="panel"><span className="eyebrow">MINHA CONTA</span><h2>Perfil</h2><p className="muted">{user?`Conectado como ${user}`:"Faça login na aba Hoje para registrar suas leituras."}</p><div className="metric-grid"><div><BookOpen/><strong>{done.length}</strong><span>Capítulos lidos</span></div><div><CalendarDays/><strong>{finishedDays}</strong><span>Dias completos</span></div><div><Trophy/><strong>{annualProgress}%</strong><span>Plano anual</span></div></div>{user&&<button className="signout" onClick={()=>void signOut()}>Sair da conta</button>}</section>}
  <footer>LAB · Leitura bíblica integral · {year}</footer>
 </main>;
}