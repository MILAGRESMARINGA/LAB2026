import {useCallback,useEffect,useMemo,useState} from "react";
import {ArrowLeft,ArrowRight,Award,BookOpen,CalendarDays,Check,CheckCircle2,Compass,Flame,Library,LockKeyhole,BookMarked,LogIn,LogOut,Play,ExternalLink,Sparkles,Target,Trophy,Crown,Users,UserRound,Video} from "lucide-react";
import {createGamePlan,GAME_DAYS,verifyGamePlan} from "./domain/game-plan";
import {categoryOfBook,STUDY_BLOCKS,BIBLEPROJECT_PLAYLISTS,BIBLEPROJECT_OFFICIAL_COLLECTIONS,getBibleProjectVideos,getBibleProjectVideoForChapter} from "./domain/studies";
import {CANON,OLD_TESTAMENT,NEW_TESTAMENT,totalChapters} from "./domain/canon";
import {supabase} from "./lib/supabase";
import {signOut,updateAccountPassword} from "./features/auth";
import {AccountAccess} from "./components/AccountAccess";
import {AuthFlow} from "./components/AuthFlow";
import {authRouteFromPath} from "./lib/auth-urls";
import {loadGameState,loadGameScorecard,confirmGameChapter,saveGameProfile,startNewGameCycle,type LabGameState,type LabScorecard} from "./features/lab-game";
import {createReadingGroup,getGroupInvite,joinReadingGroup,listReadingGroups,type ReadingGroup} from "./features/groups";
import {BibleReader} from "./components/BibleReader";
import {BibleLibrary} from "./components/BibleLibrary";
import {GCLeague} from "./components/GCLeague";
import {GCProfile} from "./components/GCProfile";
import {InstallApp,NetworkStatus} from "./components/InstallApp";
import {BibleProjectPlayer} from "./components/BibleProjectPlayer";
import type {BibleProjectResource} from "./domain/bibleproject";
import {readOnboardingProgress,saveOnboardingProgress} from "./domain/onboarding";
import {ChallengeJourney} from "./components/ChallengeJourney";
import {JourneyV2Panel} from "./components/JourneyV2Panel";
import {syncJourneyV2,getV2StudyRewards,confirmV2Study,type JourneyV2State} from "./features/journey-v2";
import {FormationLibrary} from "./components/FormationLibrary";
import {ProfileSettings} from "./components/ProfileSettings";
import {DailyInAppPopup} from "./components/DailyInAppPopup";
import {earnedTalentMilestones} from "./domain/journey-rewards";
import {chooseJourneyVersion} from "./domain/journey-version";
type Tab="today"|"bible"|"journey"|"studies"|"groups"|"profile";
const tabs=[{id:"journey",label:"Jornada",icon:Compass},{id:"studies",label:"Estudos",icon:Library},{id:"bible",label:"Bíblia",icon:BookMarked},{id:"groups",label:"GCs",icon:Users},{id:"profile",label:"Perfil",icon:UserRound}] as const;
const plan=createGamePlan();
const validPlan=verifyGamePlan(plan);
const v2FeatureEnabled=import.meta.env.VITE_LAB_V2_READY==="true";
const describeError=(e:unknown)=>e instanceof Error?e.message:"Não foi possível concluir a operação.";
export default function App(){
 const authQuery=typeof window==="undefined"?null:new URLSearchParams(window.location.search).get("auth");
 const authRoute=typeof window==="undefined"?"none":authRouteFromPath(window.location.pathname);
 const [tab,setTab]=useState<Tab>(()=>authQuery?"profile":"journey");
 const [user,setUser]=useState<{id:string;email:string}|null>(null);
 const [variantDecision,setVariantDecision]=useState<{userId:string;mode:"v1"|"v2"}|null>(null);
 const journeyVariant: "loading"|"v1"|"v2" = !v2FeatureEnabled?"v1":user&&variantDecision?.userId===user.id?variantDecision.mode:"loading";
 const v2Enabled=v2FeatureEnabled&&journeyVariant==="v2";
 const [authLoading,setAuthLoading]=useState(Boolean(supabase));
 const [game,setGame]=useState<LabGameState|null>(null);
 const [scorecard,setScorecard]=useState<LabScorecard|null>(null);
 const [v2Game,setV2Game]=useState<JourneyV2State|null>(null);
 const [v2Epoch,setV2Epoch]=useState(0);
 const handleV2State=useCallback((next:JourneyV2State|null)=>setV2Game(next),[]);
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [introStep,setIntroStep]=useState(()=>readOnboardingProgress().step),[preferredMode,setPreferredMode]=useState<"individual"|"grupo">(()=>readOnboardingProgress().mode);
 const [viewAuth,setViewAuth]=useState(()=>readOnboardingProgress().viewAuth);
 const [passwordRecoveryMode,setPasswordRecoveryMode]=useState(false);
 const [newPassword,setNewPassword]=useState("");
 const [recoveryNotice,setRecoveryNotice]=useState("");
 const [lessonOpen,setLessonOpen]=useState(false);
 const [activeVideo,setActiveVideo]=useState<{resource:BibleProjectResource;book:string}|null>(null);
 const openVideo=(resource:BibleProjectResource,book:string)=>setActiveVideo({resource,book});
 const [lastConfirmed,setLastConfirmed]=useState<{book:string;chapter:number}|null>(null);
 const [profileName,setProfileName]=useState(""),[optIn,setOptIn]=useState(false);
 const [groups,setGroups]=useState<ReadingGroup[]>([]);
 const [groupName,setGroupName]=useState(""),[inviteCode,setInviteCode]=useState("");
 const [groupBusy,setGroupBusy]=useState(false),[groupMessage,setGroupMessage]=useState("");
 const [invites,setInvites]=useState<Record<string,string>>({});
 const [rankingGroup,setRankingGroup]=useState("");
 const [selectedStudy,setSelectedStudy]=useState(STUDY_BLOCKS[0].id);
 const [studyAcknowledged,setStudyAcknowledged]=useState(false);
 const [studyRewarded,setStudyRewarded]=useState<string[]>([]);
 const [selectedBook,setSelectedBook]=useState<string>("Gênesis");
 const [showStages,setShowStages]=useState(28);
 useEffect(()=>{saveOnboardingProgress({step:introStep,mode:preferredMode,viewAuth})},[introStep,preferredMode,viewAuth]);
 const refreshScorecard=useCallback(async()=>{try{setScorecard(await loadGameScorecard())}catch(e){setMessage(describeError(e))}},[]);
 const refreshGame=useCallback(async()=>{if(v2Enabled||journeyVariant==="loading")return;setLoading(true);try{const state=await loadGameState();setGame(state);setProfileName(state.display_name||"Leitor LAB");setOptIn(Boolean(state.leaderboard_opt_in));setMessage("")}catch(e){setMessage(describeError(e))}finally{setLoading(false)}},[v2Enabled,journeyVariant]);
 useEffect(()=>{
  const client=supabase;if(!client)return;
  let active=true;
  let authEventReceived=false;
  const setAuth=async()=>{
   const {data:{user:authenticated}}=await client.auth.getUser();
   if(!active||authEventReceived)return;
   setUser(authenticated?{id:authenticated.id,email:authenticated.email||""}:null);
   setAuthLoading(false);
  };
  void setAuth();
  const {data:{subscription}}=client.auth.onAuthStateChange((event,session)=>{
   if(!active)return;
   authEventReceived=true;
   if(event==="PASSWORD_RECOVERY")setPasswordRecoveryMode(true);
   const authenticated=session?.user;
   setUser(authenticated?{id:authenticated.id,email:authenticated.email||""}:null);
   setAuthLoading(false);
  });
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!user||!v2FeatureEnabled){setVariantDecision(null);return}
  let active=true;
  const userId=user.id;
  void Promise.all([
   supabase!.from("lab_game_runs").select("id").eq("user_id",userId).limit(1),
   supabase!.from("lab_v2_runs").select("id").eq("user_id",userId).limit(1)
  ]).then(([legacy,v2])=>{
   if(!active)return;
   setVariantDecision({userId,mode:chooseJourneyVersion({
    featureEnabled:v2FeatureEnabled,
    hasLegacyRun:Boolean(legacy.data?.length),
    hasV2Run:Boolean(v2.data?.length),
    lookupFailed:Boolean(legacy.error||v2.error)
   })});
  }).catch(()=>{if(active)setVariantDecision({userId,mode:"v1"})});
  return()=>{active=false};
 },[user?.id]);
 useEffect(()=>{if(!user){setGame(null);setScorecard(null);setV2Game(null);setGroups([]);return}if(passwordRecoveryMode||journeyVariant==="loading")return;
  if(v2Enabled){
   let active=true;
   void Promise.resolve(supabase!.from("lab_game_stats").select("display_name,leaderboard_opt_in")
    .eq("user_id",user.id).maybeSingle()).then(({data})=>{
     if(active){setProfileName(data?.display_name??"Leitor LAB");setOptIn(Boolean(data?.leaderboard_opt_in))}}).catch(()=>undefined);
   return()=>{active=false};
  }
  void refreshGame();void refreshScorecard();
 },[user?.id,refreshGame,refreshScorecard,passwordRecoveryMode,journeyVariant]);
 useEffect(()=>{
  if(!user||(tab!=="groups"&&tab!=="profile"))return;
  let active=true;
  void listReadingGroups().then(data=>{if(active){setGroups(data);setRankingGroup(prev=>prev||data[0]?.id||"")}}).catch(e=>{if(active)setGroupMessage(describeError(e))});
  return()=>{active=false};
 },[tab,user?.id]);
 useEffect(()=>{
  if(!v2Enabled||!v2Game||tab!=="studies")return;
  let active=true;
  void getV2StudyRewards(v2Game.run_id).then(keys=>{if(active)setStudyRewarded(keys)})
   .catch(e=>{if(active)setMessage(describeError(e))});
  return()=>{active=false};
 },[tab,v2Game?.run_id,user?.id]);
  const stage=game?plan[Math.max(0,Math.min(GAME_DAYS-1,game.day-1))]:plan[0];
 const completedIds=new Set(game?.checked??[]);
 const nextChapter=stage.chapters.find(ch=>!completedIds.has(ch.id));
 const nextVideo=nextChapter?getBibleProjectVideoForChapter(nextChapter.book,nextChapter.chapter):undefined;
 const selectedBookVideos=getBibleProjectVideos(selectedBook);
 const bookJustFinished=lastConfirmed!==null&&CANON.some(([book,total])=>book===lastConfirmed.book&&total===lastConfirmed.chapter);
 const stageDone=Boolean(game)&&!nextChapter;
 const stageProgress=stage.chapters.length?Math.round(completedIds.size/stage.chapters.length*100):0;
 const activeDays=v2Enabled?(v2Game?.completed_stages??0):(game?.completed_days??0);
 const totalXP=v2Enabled?(v2Game?.run_xp??0):(scorecard?.total_xp??game?.total_xp??0);
 const bestDays=v2Enabled?(v2Game?.best_completed_stages??0):(game?.best_days??0);
 const talentMilestones=earnedTalentMilestones(bestDays);
 const rankLevel=bestDays>=365?"Guardião da Palavra":bestDays>=100?"Peregrino":bestDays>=30?"Constante":bestDays>=7?"Semeador":"Iniciante";
 const flameLevel=v2Enabled&&v2Game?.status==="failed"?"ember":activeDays>=30?"intense":activeDays>=7?"steady":activeDays>0?"growing":"quiet";
 const changePassword=async()=>{setBusy(true);setRecoveryNotice("");try{
  await updateAccountPassword(newPassword);
  setPasswordRecoveryMode(false);setNewPassword("");
  window.history.replaceState(null,"",window.location.pathname);
  setMessage("Sua senha foi atualizada.");
 }catch(e){setRecoveryNotice(describeError(e))}finally{setBusy(false)}};
 const confirm=async()=>{if(!nextChapter||!user||busy)return;setBusy(true);setMessage("");try{const chapter=nextChapter;const updated=await confirmGameChapter(chapter.id);setGame(updated);setLastConfirmed({book:chapter.book,chapter:chapter.chapter});void refreshScorecard()}catch(e){setMessage(describeError(e));void refreshGame()}finally{setBusy(false)}};
 const restartChallenge=async()=>{if(!user||busy)return;setBusy(true);setMessage("");try{const next=await startNewGameCycle();setGame(next);setLessonOpen(false);setLastConfirmed(null);void refreshScorecard()}catch(e){setMessage(describeError(e))}finally{setBusy(false)}};
 const finishStudyV2=async()=>{
  if(!v2Game||!studyAcknowledged||busy||v2Game.status!=="active")return;
  setBusy(true);setMessage("");
  try{
   const answer=await confirmV2Study(v2Game.run_id,selectedStudy,true);
   setStudyRewarded(prev=>prev.includes(selectedStudy)?prev:[...prev,selectedStudy]);
   setV2Game(await syncJourneyV2(v2Game.run_id));
   setStudyAcknowledged(false);
   setMessage(answer.awarded?"Estudo concluído: +15 XP nesta tentativa.":"Estudo já premiado nesta tentativa.");
  }catch(e){setMessage(describeError(e))}finally{setBusy(false)}
 };
  const refreshGroups=async()=>{const data=await listReadingGroups();setGroups(data);if(!rankingGroup&&data[0])setRankingGroup(data[0].id)};
 const createGroup=async()=>{setGroupBusy(true);setGroupMessage("");try{await createReadingGroup(groupName);setGroupName("");await refreshGroups();setGroupMessage("Seu GC foi criado.")}catch(e){setGroupMessage(describeError(e))}finally{setGroupBusy(false)}};
 const joinGroup=async()=>{setGroupBusy(true);setGroupMessage("");try{await joinReadingGroup(inviteCode);setInviteCode("");await refreshGroups();setGroupMessage("Você entrou no GC.")}catch(e){setGroupMessage(describeError(e))}finally{setGroupBusy(false)}};
 const viewInvite=async(groupId:string)=>{setGroupBusy(true);try{const token=await getGroupInvite(groupId);setInvites(prev=>({...prev,[groupId]:token}))}catch(e){setGroupMessage(describeError(e))}finally{setGroupBusy(false)}};

 const saveProfile=async()=>{setBusy(true);setMessage("");try{await saveGameProfile(profileName,optIn);if(!v2Enabled)await refreshGame();setMessage("Preferências atualizadas.")}catch(e){setMessage(describeError(e))}finally{setBusy(false)}};
 const logout=async()=>{
  if(busy)return;
  setBusy(true);setMessage("");
  try{
   await signOut();
   // Remove all account-specific UI state, including any previously revealed GC invite.
   setUser(null);setGame(null);setV2Game(null);setScorecard(null);setGroups([]);setInvites({});
   setRankingGroup("");setActiveVideo(null);setLessonOpen(false);setLastConfirmed(null);
   setProfileName("");setOptIn(false);setGroupMessage("");setPasswordRecoveryMode(false);
   setTab("profile");
   setMessage("Você saiu da conta neste dispositivo. Entre com outra conta quando quiser.");
  }catch(e){
   setMessage("Não foi possível sair da conta: "+describeError(e));
  }finally{setBusy(false)}
 };

 const selectedBlock=useMemo(()=>STUDY_BLOCKS.find(b=>b.id===selectedStudy)??STUDY_BLOCKS[0],[selectedStudy]);
 const goTab=(next:Tab)=>{setMessage("");setLessonOpen(false);setLastConfirmed(null);setTab(next);if(next==="journey"&&user&&!v2Enabled)void refreshGame()};
 if(authRoute!=="none")return <AuthFlow route={authRoute}/>;
 return <div className="game-app">
  <header className="game-header"><div className="brandmark"><span className="brand-symbol"><Flame size={23}/></span><div><strong>LAB<span>GAME</span></strong><small>LEITURA ANUAL DA BÍBLIA</small></div></div><div className="header-status"><span className={"flame-indicator "+flameLevel} title="Sequência atual de leitura"><Flame size={20}/>{activeDays}</span><span className="xp-counter" title="Pontos validados no servidor"><Award size={18}/>{totalXP} XP</span><span className="talents-counter" title="Marcos semanais da melhor sequência de leitura"><Trophy size={17}/>{talentMilestones} Talentos</span></div></header>
  <NetworkStatus/>
  <DailyInAppPopup userId={user?.id??null}
   day={v2Enabled?(v2Game?.status==="active"?v2Game.stage:null):(game?.day??null)}
   today={v2Enabled?(v2Game?.run_id&&v2Game.stage?`${v2Game.run_id}:${v2Game.stage}`:null):(game?.today??null)}
   readingComplete={v2Enabled?Boolean(v2Game?.completed_at):Boolean(game?.finished||stageDone)}
   visibleOnJourney={tab==="journey"&&!lessonOpen}
   onRead={()=>{if(v2Enabled){setTab("journey")}else{setTab("today");setLessonOpen(true);setLastConfirmed(null)}}}/>
  <main className="game-content">
   {tab==="today"&&user&&game&&lessonOpen?<section className="lesson-screen game-panel"><div className="lesson-head"><button type="button" className="lesson-back" aria-label="Sair da leitura" onClick={()=>{setLessonOpen(false);setLastConfirmed(null);setTab("journey")}}><ArrowLeft size={23}/></button><div className="lesson-screen-progress"><div style={{width:String(stageProgress)+"%"}}/></div><span className="flame-indicator"><Flame size={19}/>{activeDays}</span></div>{lastConfirmed?<div className="lesson-feedback"><div className="victory-icon"><CheckCircle2 size={47}/></div><span className="eyebrow">LEITURA REGISTRADA</span><h1>Excelente!</h1><p>Você confirmou {lastConfirmed.book} {lastConfirmed.chapter} e recebeu <strong>+10 XP</strong>.</p>{game?.finished&&scorecard?.cycle_awards?.filter(award=>award.run_id===game.run_id).map(award=><div className="lab-cycle-victory" role="status" key={award.run_id}><Crown size={30}/><div><strong>Coroa {award.cycle_number} conquistada!</strong><p>Bíblia completa · bônus confirmado de +{award.bonus_xp.toLocaleString("pt-BR")} XP</p></div></div>)}{bookJustFinished&&<div className="finished-book-panel"><h2>Livro concluído!</h2><p>Quer conhecer o panorama completo de {lastConfirmed.book}? Este recurso é opcional e não altera seu XP.</p><div className="finished-book-links">{getBibleProjectVideos(lastConfirmed.book).map(resource=><button type="button" key={resource.url} onClick={()=>openVideo(resource,lastConfirmed.book)}><Video size={17}/><span>{resource.title}</span><Video size={14}/></button>)}</div></div>}<button type="button" className="primary-cta" onClick={()=>{setLastConfirmed(null);if(!nextChapter){setLessonOpen(false);setTab("journey")}}}>{nextChapter?"PRÓXIMO CAPÍTULO":"CONCLUIR ETAPA"} <ArrowRight size={18}/></button></div>:nextChapter?<div className="lesson-reading"><span className="eyebrow">ETAPA {stage.day} · CAPÍTULO {completedIds.size+1} DE {stage.chapters.length}</span><div className="lab-emblem small"><BookOpen size={34}/></div><h1>{nextChapter.book} <em>{nextChapter.chapter}</em></h1><div className="lesson-category">{categoryOfBook(nextChapter.book)}</div><p>Leia abaixo o texto integral do capítulo. Reflita sobre a mensagem central antes de confirmar sua leitura.</p><div className="reading-reflection"><Sparkles size={23}/><div><strong>Pausa para reflexão</strong><span>O que este capítulo ensina sobre Deus, as pessoas ou a história da redenção?</span></div></div>{nextVideo&&<button type="button" className="lesson-video-resource" onClick={()=>openVideo(nextVideo,nextChapter.book)}><Video size={20}/><span><strong>Panorama do BibleProject</strong><small>{nextVideo.title} · Recurso opcional de contextualização</small></span><Video size={17}/></button>}<BibleReader key={nextChapter.id} chapterId={nextChapter.id} onConfirm={()=>void confirm()} busy={busy}/></div>:<div className="lesson-feedback"><Trophy size={50}/><h1>Dia conquistado!</h1><p>Seu próximo desafio será liberado amanhã.</p><button className="primary-cta" onClick={()=>{setLessonOpen(false);setTab("journey")}}>VOLTAR À JORNADA</button></div>}{message&&<p role="status" className="feedback-message">{message}</p>}</section>:(tab==="journey"||tab==="today")&&<div className="today-layout">
    {authLoading?<section className="game-panel"><p className="muted" role="status">Restaurando sua sessão...</p></section>:!user?<section className={"onboarding game-panel"+(introStep===3&&!viewAuth?" onboarding-journey":"")}>
      {!viewAuth?<><div className="intro-progress"><div style={{width:String((introStep+1)*25)+"%"}}/></div><div className="onboarding-visual"><div className="lab-emblem"><Flame size={61}/></div><span className="eyebrow">SUA JORNADA COMEÇA AQUI</span></div>
       {introStep===0&&<><h1>A Bíblia toda.<br/><em>Um dia de cada vez.</em></h1><p>365 etapas, até quatro capítulos por dia. Uma experiência de leitura e constância, individualmente ou com seu GC.</p></>}
       {introStep===1&&<><h1>Acenda a sua <em>constância.</em></h1><p>Confirme a leitura de cada capítulo do dia. Você não pode avançar antes da hora. Se perder um dia, a tentativa recomeça — mas seu recorde permanece.</p><div className="feature-row"><Flame/><span>Chama de constância</span><Trophy/><span>Recorde pessoal</span></div></>}
       {introStep===2&&<><h1>Como você quer <em>começar?</em></h1><p>Você poderá participar de grupos depois, mesmo começando individualmente.</p><div className="onboarding-choices"><button className={preferredMode==="individual"?"chosen":""} onClick={()=>setPreferredMode("individual")}><UserRound/> Minha jornada individual <Check/></button><button className={preferredMode==="grupo"?"chosen":""} onClick={()=>setPreferredMode("grupo")}><Users/> Com meu grupo de crescimento <Check/></button></div></>}
       {introStep===3&&<ChallengeJourney plan={plan} game={null} totalXP={0} preview onStart={()=>setViewAuth(true)} onExploreBible={()=>goTab("bible")}/>}
       <div className="intro-actions">{introStep>0&&<button type="button" className="subtle-button" onClick={()=>setIntroStep(n=>n-1)}><ArrowLeft size={16}/> Voltar</button>}{introStep<3&&<button className="primary-cta" onClick={()=>setIntroStep(n=>n+1)}>CONTINUAR <ArrowRight size={19}/></button>}</div>
      </>:<>
       <AccountAccess initialMode="signup" preferredMode={preferredMode} title="Sua jornada começa aqui" onLogin={()=>{setViewAuth(false);if(preferredMode==="grupo")setTab("groups")}}/>
       <button type="button" className="subtle-button" onClick={()=>setViewAuth(false)}><ArrowLeft size={17}/> Voltar à apresentação</button>
      </>}
       {message&&<p role="status" className="feedback-message">{message}</p>}
     </section>:<>{journeyVariant==="loading"?<section className="game-panel"><p role="status" className="muted">Verificando a versão da sua Jornada...</p></section>:v2Enabled?<JourneyV2Panel key={user.id+"-"+v2Epoch} userId={user.id} onState={handleV2State}/>:game?<ChallengeJourney plan={plan} game={game} totalXP={totalXP} onStart={()=>{setLastConfirmed(null);setTab("today");setLessonOpen(true)}} onRestart={()=>void restartChallenge()} onExploreBible={()=>goTab("bible")}/>:<section className="game-panel"><p className="muted" role="status">{loading?"Carregando seu desafio...":message||"Aguardando a sincronização da leitura."}</p></section>}{message&&game&&<p role="status" className="feedback-message">{message}</p>}
      <section className="connections-panel"><span className="eyebrow">CONEXÕES DA PALAVRA</span><h3>Estude além do capítulo</h3><p>Explore temas, contextos e conexões entre livros sem alterar a regra da leitura diária.</p><button className="secondary-cta" onClick={()=>goTab("studies")}>EXPLORAR ESTUDOS <ArrowRight size={17}/></button></section></>}
   </div>}
   {tab==="bible"&&<BibleLibrary signedIn={Boolean(user)} onVideo={openVideo}/>}
   {tab==="studies"&&<section className="game-panel"><span className="eyebrow">BIBLIOTECA LAB</span><h1>Estudos e <em>conexões.</em></h1><p className="muted">Panoramas literários, históricos e teológicos para acompanhar a leitura, sem pontuação de capítulos.</p><div className="study-grid">{STUDY_BLOCKS.map(b=><button key={b.id} className={"study-tile "+(selectedStudy===b.id?"selected":"")} onClick={()=>{setSelectedStudy(b.id);setStudyAcknowledged(false)}}><Library size={24}/><strong>{b.title}</strong><small>{b.type==="conexão"?"Conexão bíblica":"Tema de estudo"}</small></button>)}</div><article className="study-detail"><span className="eyebrow">APROFUNDAMENTO</span><h2>{selectedBlock.title}</h2><p>{selectedBlock.intro}</p><h3>Leia e compare</h3><div className="reference-list">{selectedBlock.references.map(ref=><span key={ref}><BookOpen size={15}/>{ref}</span>)}</div><p className="small-caption">Estas conexões são roteiros de estudo. A exegese capítulo a capítulo será publicada após revisão bíblica e teológica.</p>{v2Enabled&&<div className="v2-study-check" aria-label="Pontuação opcional do estudo">
  <h3>Conclusão de estudo · +15 XP</h3>
  {!v2Game||v2Game.status!=="active"?<p className="muted">Ative uma Jornada V2 para registrar este estudo na tentativa atual.</p>:
   studyRewarded.includes(selectedStudy)?<p role="status"><CheckCircle2 size={17}/> Este estudo já recebeu 15 XP nesta tentativa.</p>:<>
    <label className="v2-consent"><input type="checkbox" checked={studyAcknowledged} onChange={e=>setStudyAcknowledged(e.target.checked)}/> Examinei as referências indicadas e concluí a reflexão sobre este estudo.</label>
    <button type="button" className="secondary-cta" disabled={busy||!studyAcknowledged} onClick={()=>void finishStudyV2()}>CONFIRMAR ESTUDO · +15 XP</button>
   </>}
 </div>}</article><FormationLibrary/><article className="study-detail bibleproject-section">
 <span className="eyebrow">66 LIVROS · VÍDEOS EM PORTUGUÊS</span>
 <h2>Panoramas BibleProject</h2>
 <p>Assista a um panorama antes ou depois de ler. Alguns livros têm dois vídeos e outros compartilham um panorama. Os vídeos não alteram a pontuação nem a sequência diária.</p>
 <div className="playlist-links">
  <a href={BIBLEPROJECT_PLAYLISTS.AT} target="_blank" rel="noopener noreferrer"><Video size={20}/><span><strong>Playlist Antigo Testamento</strong><small>YouTube · 39 livros</small></span><ExternalLink size={16}/></a>
  <a href={BIBLEPROJECT_PLAYLISTS.NT} target="_blank" rel="noopener noreferrer"><Video size={20}/><span><strong>Playlist Novo Testamento</strong><small>YouTube · 27 livros</small></span><ExternalLink size={16}/></a>
 </div>
 <label className="video-book-label" htmlFor="bibleproject-book">Escolha o livro bíblico</label>
 <select id="bibleproject-book" className="bibleproject-select" value={selectedBook} onChange={e=>setSelectedBook(e.target.value)}>
  <optgroup label="Antigo Testamento">{OLD_TESTAMENT.map(([book])=><option key={book} value={book}>{book}</option>)}</optgroup>
  <optgroup label="Novo Testamento">{NEW_TESTAMENT.map(([book])=><option key={book} value={book}>{book}</option>)}</optgroup>
 </select>
 <div className="book-videos" aria-live="polite">
  {selectedBookVideos.map((item,i)=><button type="button" className="book-video-item" onClick={()=>openVideo(item,selectedBook)} key={item.url+"-"+i}>
   <div className="book-video-icon"><Play size={21}/></div>
   <span><strong>{item.title}</strong><small>{item.kind==="guide"?"Guia oficial com panorama em vídeo":"Vídeo oficial em português"}</small></span>
   <Video size={17}/>
  </button>)}
 </div>
 <p className="small-caption">Conteúdo externo do BibleProject. <a href={BIBLEPROJECT_OFFICIAL_COLLECTIONS.AT} target="_blank" rel="noopener noreferrer">Coleção oficial do AT</a> · <a href={BIBLEPROJECT_OFFICIAL_COLLECTIONS.NT} target="_blank" rel="noopener noreferrer">Coleção oficial do NT</a>.</p>
 </article></section>}
   {tab==="groups"&&<section className="game-panel"><span className="eyebrow">COMUNIDADE E CONSTÂNCIA</span><h1>Seus <em>GCs.</em></h1><p className="muted">Participe do seu grupo de crescimento e compare a constância entre leitores que escolherem aparecer no ranking.</p>{authLoading?<p className="muted" role="status">Restaurando sua sessão...</p>:!user?<AccountAccess initialMode="login" title="Entre para criar ou participar do GC"/>:<><div className="group-forms"><form onSubmit={e=>{e.preventDefault();void createGroup()}}><h3>Criar um GC</h3><label htmlFor="gc-name">Nome do grupo</label><input id="gc-name" minLength={2} maxLength={100} required value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Ex.: GC O Caminho"/><button type="submit" disabled={groupBusy}>CRIAR GC</button></form><form onSubmit={e=>{e.preventDefault();void joinGroup()}}><h3>Entrar por convite</h3><label htmlFor="gc-code">Código recebido</label><input id="gc-code" required value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="Código do líder"/><button type="submit" disabled={groupBusy}>ENTRAR NO GC</button></form></div>{groupMessage&&<p role="status" className="feedback-message">{groupMessage}</p>}<h2>Grupos em que participo</h2>{groups.length===0?<p className="muted">Você ainda não está em nenhum grupo.</p>:groups.map(g=><div className="group-entry" key={g.id}><div><strong>{g.name}</strong><small>{g.owner_id===user.id?"Líder do grupo":"Participante"}</small></div><button type="button" className={rankingGroup===g.id?"gc-select-active":""} onClick={()=>setRankingGroup(g.id)}>PERFIL DO GC</button>{g.owner_id===user.id&&<button type="button" disabled={groupBusy} onClick={()=>void viewInvite(g.id)}>CONVITE</button>}{invites[g.id]&&<div className="invite-token"><span>{invites[g.id]}</span><button type="button" onClick={()=>void navigator.clipboard?.writeText(invites[g.id])}>COPIAR</button></div>}</div>)}{groups.length>0&&<GCProfile key={rankingGroup||groups[0].id} group={groups.find(g=>g.id===rankingGroup)??groups[0]} userId={user.id} personalXp={scorecard?.total_xp??game?.total_xp??null} onPersonalProfile={()=>setTab("profile")}/>}
<GCLeague userId={user.id} groups={groups} onGroupsChange={refreshGroups}/></>}</section>}
   {tab==="profile"&&<section className="game-panel"><span className="eyebrow">PERFIL E CONQUISTAS</span><h1>Minha <em>jornada.</em></h1>{authLoading?<p className="muted" role="status">Restaurando sua sessão...</p>:!user?<AccountAccess initialMode={authQuery==="reset"?"reset":"login"} title="Acesse seu perfil pessoal"/>:<><p className="muted">{user.email}</p><div className="profile-rank"><Trophy size={34}/><div><span>SEU NÍVEL</span><strong>{rankLevel}</strong><small>Seu crescimento é medido em dias de leitura confirmados, não em valor espiritual.</small></div></div><div className="journey-stats"><div><Flame/><strong>{activeDays}</strong><span>Constância</span></div><div><Trophy/><strong>{bestDays}</strong><span>Recorde</span></div><div><Award/><strong>{totalXP}</strong><span>XP total</span></div></div>{!v2Enabled&&<section className="personal-scorecard" aria-label="Pontuação individual detalhada">
 <span className="eyebrow">MEUS PONTOS</span>
 <h2>Como ganho XP?</h2>
 <div className="scorecard-breakdown">
  <div><BookOpen size={20}/><strong>{scorecard?.reading_xp??0}</strong><span>XP de leitura</span><small>{scorecard?.chapters_confirmed??0} capítulos × 10 XP</small></div>
  <div><Video size={20}/><strong>{scorecard?.video_xp??0}</strong><span>XP extra por vídeo</span><small>{scorecard?.panoramas_confirmed??0} panoramas × 5 XP</small></div>
  {scorecard?.cycle_bonus_xp!==undefined&&<div><Crown size={20}/><strong>{scorecard.cycle_bonus_xp.toLocaleString("pt-BR")}</strong><span>Bônus anuais</span><small>{scorecard.completed_cycles??0} ciclo(s) premiado(s)</small></div>}
  <div><Trophy size={20}/><strong>{totalXP.toLocaleString("pt-BR")}</strong><span>XP acumulado</span><small>Leitura + vídeos + bônus confirmados</small></div>
 </div>
 <p className="small-caption">Seu recorde é de {bestDays} dias consecutivos. Uma falha reinicia a tentativa, mas mantém o recorde e o XP acumulado. Os vídeos não substituem os capítulos da leitura.</p>
 {scorecard&&!scorecard.balanced&&<p role="alert" className="feedback-message">A pontuação registrada diverge do histórico. O total acima foi recalculado a partir das atividades confirmadas.</p>}
  {scorecard?.cycle_awards&&scorecard.cycle_awards.length>0&&<div className="lab-cycle-awards" aria-label="Histórico de coroas de leitura anual">
   <h3><Crown size={21}/> Minhas coroas da jornada</h3>
   <p className="muted">Cada coroa confirma uma leitura integral do cânon protestante, registrada pelo servidor.</p>
   <div className="lab-cycle-awards-list">{scorecard.cycle_awards.map(award=><div className="lab-cycle-award" key={award.run_id}>
    <span className="lab-cycle-award-icon"><Crown size={22}/></span>
    <div><strong>Coroa {award.cycle_number} · Bíblia completa</strong><small>{new Date(award.awarded_at).toLocaleDateString("pt-BR")}</small></div>
    <b>+{award.bonus_xp.toLocaleString("pt-BR")} XP</b>
   </div>)}</div>
  </div>}
 </section>}
 {v2Enabled&&<section className="personal-scorecard" aria-label="Pontuação da tentativa V2">
  <span className="eyebrow">PONTUAÇÃO ATUAL · V2</span>
  <h2>{v2Game?.run_xp??0} XP nesta sequência</h2>
  <p className="muted">Históricos antigos são recordes a superar; não entram na pontuação da tentativa atual.</p>
  <p className="muted">{v2Game?.completed_bibles_historical??0} Bíblia(s) completa(s) registrada(s).</p>
 </section>}
 <h2>Meus marcos</h2><div className="milestone-list">{[1,7,30,100,180,365].map(goal=><div className={"milestone "+(bestDays>=goal?"earned":"")} key={goal}><Award size={19}/><span>{goal===365?"Bíblia completa":goal+" dias seguidos"}</span><strong>{bestDays>=goal?"CONQUISTADO":"BLOQUEADO"}</strong></div>)}</div><form className="profile-form" onSubmit={e=>{e.preventDefault();void saveProfile()}}><h2>Identidade no GC</h2><label htmlFor="display-name">Nome exibido</label><input id="display-name" value={profileName} minLength={2} maxLength={60} required onChange={e=>setProfileName(e.target.value)}/><label className="toggle-rank"><input type="checkbox" checked={optIn} onChange={e=>setOptIn(e.target.checked)}/> Quero aparecer nos rankings privados dos meus GCs.</label><button className="secondary-cta" disabled={busy} type="submit">SALVAR PERFIL</button></form><section className="account-security"><h2><LockKeyhole size={21}/> Segurança da conta</h2><p className="muted">Encerre sua sessão neste dispositivo. Seus dados e pontos serão preservados.</p><button className="logout-cta" type="button" disabled={busy} onClick={()=>void logout()}><LogOut size={18}/> {busy?"SAINDO...":"SAIR DA CONTA"}</button></section>
<ProfileSettings accountEmail={user.email} onReset={async()=>{if(v2Enabled){setV2Game(null);setV2Epoch(n=>n+1)}else{await refreshGame();await refreshScorecard()}setLessonOpen(false);setLastConfirmed(null);setTab("journey")}} onDeleted={()=>{setUser(null);setGame(null);setV2Game(null);setScorecard(null);setGroups([]);setInvites({});setLessonOpen(false);setTab("profile");setMessage("Conta excluída. Você pode criar uma nova conta quando quiser.")}}/>{message&&<p role="status" className="feedback-message">{message}</p>}</>}<InstallApp/></section>}
  </main>
  <nav className="game-bottom-nav" aria-label="Menu LABGAME">{tabs.map(t=><button key={t.id} type="button" className={tab===t.id?"active":""} onClick={()=>goTab(t.id)} aria-current={tab===t.id?"page":undefined}><t.icon size={21}/><span>{t.label}</span></button>)}</nav>
  {activeVideo&&<BibleProjectPlayer key={activeVideo.resource.url} resource={activeVideo.resource} book={activeVideo.book} signedIn={Boolean(user)} runId={v2Enabled?v2Game?.status==="active"?v2Game.run_id:null:null} onClose={()=>setActiveVideo(null)} onBonus={total=>{
    if(v2Enabled){if(v2Game)void syncJourneyV2(v2Game.run_id).then(next=>setV2Game(next)).catch(e=>setMessage(describeError(e)))}
    else {setGame(prev=>prev?{...prev,total_xp:total}:prev);void refreshScorecard()}
   }}/>}
  {passwordRecoveryMode&&<div className="password-recovery-mask">
   <form className="password-recovery-modal" aria-label="Criar nova senha" onSubmit={e=>{e.preventDefault();void changePassword()}}>
    <span className="eyebrow">SEGURANÇA DA CONTA</span>
    <h2>Crie uma nova senha</h2>
    <p>Seu link de recuperação foi reconhecido. Defina uma nova senha para continuar sua jornada.</p>
    <label htmlFor="lab-new-password">Nova senha (mínimo de 8 caracteres)</label>
    <input id="lab-new-password" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
    <button type="submit" className="primary-cta" disabled={busy||newPassword.length<8}>ATUALIZAR SENHA</button>
    {recoveryNotice&&<p role="alert" className="feedback-message">{recoveryNotice}</p>}
   </form>
  </div>}
  <footer className="game-footer">LABGAME · {CANON.length} livros · {totalChapters.toLocaleString("pt-BR")} capítulos · {validPlan?"Plano íntegro":"Erro no plano"}</footer>
 </div>;
}
