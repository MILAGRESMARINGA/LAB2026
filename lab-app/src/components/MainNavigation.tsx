import "./help-center.css";
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
 return <nav className="game-bottom-nav" aria-label="Menu LABGAME">{MAIN_TABS.map(tab=>{
  const content=<><tab.icon size={21} aria-hidden="true"/><span>{tab.label}</span></>;
  return onNavigate?<button key={tab.id} type="button" className={activeTab===tab.id?'active':''} aria-current={activeTab===tab.id?'page':undefined} onClick={()=>onNavigate(tab.id)}>{content}</button>:<a key={tab.id} href={`/?tab=${tab.id}`} className={activeTab===tab.id?'active':''} aria-current={activeTab===tab.id?'page':undefined}>{content}</a>;
 })}</nav>;
}
