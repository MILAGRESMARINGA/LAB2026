import {useEffect,useState} from "react";
import {Download,Smartphone,WifiOff} from "lucide-react";

type InstallPromptEvent=Event&{
 prompt:()=>Promise<void>;
 userChoice:Promise<{outcome:"accepted"|"dismissed"}>;
};
function isStandalone():boolean{
 return window.matchMedia("(display-mode: standalone)").matches||
  Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
}
export function InstallApp(){
 const [prompt,setPrompt]=useState<InstallPromptEvent|null>(null);
 const [installed,setInstalled]=useState(()=>isStandalone());
 const [offline,setOffline]=useState(()=>!navigator.onLine);
 useEffect(()=>{
  const available=(event:Event)=>{
   event.preventDefault();
   setPrompt(event as InstallPromptEvent);
  };
  const installedNow=()=>{setInstalled(true);setPrompt(null)};
  const online=()=>setOffline(!navigator.onLine);
  window.addEventListener("beforeinstallprompt",available);
  window.addEventListener("appinstalled",installedNow);
  window.addEventListener("online",online);
  window.addEventListener("offline",online);
  return()=>{
   window.removeEventListener("beforeinstallprompt",available);
   window.removeEventListener("appinstalled",installedNow);
   window.removeEventListener("online",online);
   window.removeEventListener("offline",online);
  };
 },[]);
 const install=async()=>{
  if(!prompt)return;
  try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==="accepted")setPrompt(null)}
  catch{setPrompt(null)}
 };
 return <section className="install-labgame" aria-label="Instalar LABGAME no celular">
  <div className="install-heading"><div className="install-app-icon"><Smartphone size={26}/></div>
   <div><span className="eyebrow">LABGAME NO CELULAR</span><h2>Tenha a Bíblia na sua tela inicial</h2></div>
  </div>
  {installed?<p>LABGAME já está aberto no modo aplicativo neste dispositivo.</p>:
   <><p>Adicione o LABGAME à tela inicial para abrir sem precisar procurar o endereço no navegador.</p>
   {prompt?<button className="primary-cta" onClick={()=>void install()}><Download size={20}/> INSTALAR LABGAME</button>:
    <p className="install-directions"><strong>Android (Chrome):</strong> abra o menu ⋮ e escolha <em>Instalar aplicativo</em> ou <em>Adicionar à tela inicial</em>. <strong>iPhone (Safari):</strong> toque em Compartilhar e escolha <em>Adicionar à Tela de Início</em>.</p>}
   </>}
  {offline&&<p className="install-offline"><WifiOff size={17}/> Sem conexão. A interface pode abrir offline depois de instalada, mas texto bíblico, autenticação e registros de XP precisam de internet.</p>}
 </section>;
}
export function NetworkStatus(){
 const [offline,setOffline]=useState(()=>!navigator.onLine);
 useEffect(()=>{
  const update=()=>setOffline(!navigator.onLine);
  window.addEventListener("online",update);window.addEventListener("offline",update);
  return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update)};
 },[]);
 if(!offline)return null;
 return <p role="status" className="network-status"><WifiOff size={16}/> Você está sem internet. As leituras devem ser sincronizadas online para valerem no desafio.</p>;
}
