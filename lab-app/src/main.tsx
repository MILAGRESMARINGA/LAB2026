import React from "react";
import {createRoot} from "react-dom/client";
import App from "./App";
import "./style.css";
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);

// Cache only the public application shell. User data and Bible API remain network-only.
if(import.meta.env.PROD&&"serviceWorker" in navigator){
 window.addEventListener("load",()=>{
  void navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(error=>{
   console.warn("Modo instalável indisponível:",error);
  });
 });
}
