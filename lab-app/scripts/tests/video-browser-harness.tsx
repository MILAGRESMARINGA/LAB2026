// CI-only harness. Uses the actual production component; network is simulated by Playwright.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BibleProjectPlayer} from '../../src/components/BibleProjectPlayer';
import {getBibleProjectVideos} from '../../src/domain/bibleproject';
import '../../src/style.css';
function Harness(){
 const [open,setOpen]=useState(true);
 const [xp,setXp]=useState(0);
 return <><output aria-label="XP recebido">{xp}</output>{open?<BibleProjectPlayer resource={getBibleProjectVideos('Gênesis')[0]} book="Gênesis" signedIn runId="00000000-0000-4000-8000-000000000001" onClose={()=>setOpen(false)} onBonus={setXp}/>:<button onClick={()=>setOpen(true)}>Reabrir panorama</button>}</>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
