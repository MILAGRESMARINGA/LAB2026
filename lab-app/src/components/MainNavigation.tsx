import "./help-center.css";
import "./main-navigation.css";
import {BookMarked,Compass,HelpCircle,Library,UserRound,Users} from 'lucide-react';
export const MAIN_TABS=[
 {id:'journey',label:'Jornada',icon:Compass},
 {id:'studies',label:'Estudos',icon:Library},
 {id:'bible',label:'Bíblia',icon:BookMarked},
 {id:'groups',label:'GCs',icon:Users},
 {id:'profile',label:'Perfil',icon:UserRound},
 {id:'help',label:'Ajuda',icon:HelpCircle}
] as const;
export type NavigationTab=typeof MAIN_TABS[number]['id'];
export function navigationTabFromSearch(search:string):NavigationTab{
 const candidate=new URLSearchParams(search).get('tab');
 return MAIN_TABS.find(tab=>tab.id===candidate)?.id??'journey';
}
export function MainNavigation({activeTab,onNavigate}:{activeTab:NavigationTab;onNavigate?:(tab:NavigationTab)=>void}){
 return <nav className="game-bottom-nav game-main-navigation" aria-label="Menu LABGAME"><div className="main-navigation-brand" aria-hidden="true"><strong>LAB<span>GAME</span></strong><small>LEITURA ANUAL DA BÍBLIA</small></div>{MAIN_TABS.map(tab=>{
  const content=<><tab.icon size={21} aria-hidden="true"/><span>{tab.label}</span></>;
  return onNavigate?<button key={tab.id} type="button" className={activeTab===tab.id?'active':''} aria-current={activeTab===tab.id?'page':undefined} onClick={()=>onNavigate(tab.id)}>{content}</button>:<a key={tab.id} href={`/?tab=${tab.id}`} className={activeTab===tab.id?'active':''} aria-current={activeTab===tab.id?'page':undefined}>{content}</a>;
 })}<p className="main-navigation-caption">Um encontro diário<br/>com a Palavra.</p></nav>;
}
