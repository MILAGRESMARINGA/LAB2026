import type {JourneyV2State} from '../features/journey-v2';
import {CLOCK_RULES} from '../domain/journey-clock-next';
type Props={mode:'v2'|'legacy'|'demo';game?:JourneyV2State|null;now?:number;onUpgrade?:()=>void};
function dateBR(iso:string){return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}
function remaining(ms:number){const s=Math.max(0,Math.ceil(ms/1000));return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')}
export function JourneyRules({mode,game,now=Date.now(),onUpgrade}:Props){
 const normal=game?.normal_deadline_at?Date.parse(game.normal_deadline_at):null;
 const grace=game?.grace_deadline_at?Date.parse(game.grace_deadline_at):null;
 const next=game?.next_eligible_at?Date.parse(game.next_eligible_at):null;
 const complete=Boolean(game?.completed_at);
 const label=game?.status==='failed'?'Tentativa encerrada':game?.status==='completed'?'Bíblia concluída':complete&&next!==null&&now<next?'Próxima etapa em':normal===null?'Relógio ainda não iniciado':now<=normal?'Tempo para concluir a etapa':grace!==null&&now<=grace?'Carência restante':'Recuperação com vidas';
 const target=complete&&next!==null&&now<next?next:normal!==null&&now<=normal?normal:grace!==null&&now<=grace?grace:null;
 return <section className="journey-rules" aria-label="Regras e cronômetro da Jornada">
  <h2>Como jogar a Jornada</h2>
  {mode==='legacy'?<><p><strong>Sua tentativa usa o regulamento anterior.</strong> O mapa mostra o plano já vinculado à sua conta. O relógio de 24 horas e as três vidas pertencem ao novo regulamento; não são simulados nesta tentativa.</p>{onUpgrade&&<button className="secondary-cta" onClick={onUpgrade}>CONHECER A JORNADA DE 24 HORAS E 3 VIDAS</button>}</>:<>
   <div className="journey-rules-grid"><div><strong>{CLOCK_RULES.normalHours}h</strong><span>por etapa ativada</span></div><div><strong>{game?.remaining_lives_this_month??CLOCK_RULES.monthlyLives} / 3</strong><span>{mode==='demo'?'vidas no exemplo':'vidas disponíveis no mês'}</span></div><div><strong>3–4</strong><span>capítulos por etapa</span></div></div>
   <div className="journey-live-clock" role="timer" aria-label="Relógio da leitura"><div><b>{mode==='demo'?'Exemplo do regulamento':label}</b><small>{mode==='demo'?'A demonstração não ativa prazo nem consome vidas.':game?.activated_at?'Horários validados pelo servidor.':'O prazo começa ao ativar a leitura, não ao abrir o mapa.'}</small></div><strong>{mode==='demo'?'24:00:00':target!==null?remaining(target-now):game?.activated_at?'Consultar etapa':'—:—:—'}</strong></div>
   {game?.normal_deadline_at&&game?.grace_deadline_at&&<p><small>Prazo normal: {dateBR(game.normal_deadline_at)} · Fim da carência: {dateBR(game.grace_deadline_at)} · horário de Brasília.</small></p>}
  </>}
  <details><summary>Entender prazos, vidas, XP e reinício</summary>
   <ol><li><strong>Ative sua etapa.</strong> Leia todos os capítulos indicados e confirme a leitura. A distribuição contém 3 ou 4 capítulos no novo plano para cobrir os 1.189 capítulos.</li>
   <li><strong>Prazo normal: 24 horas.</strong> Ele continua contando ao fechar o aplicativo. Completar cedo não antecipa a próxima etapa: ela só pode começar depois de 24 horas da ativação e da conclusão de todos os capítulos.</li>
   <li><strong>Mais 6 horas de carência.</strong> Até 3 horas após o prazo normal, o desconto é de 3 XP; depois disso, 6 XP. O desconto da etapa é único; o servidor considera a conclusão e a ativação seguinte.</li>
   <li><strong>Três vidas mensais.</strong> Depois da carência, cada vida disponível cobre mais 24 horas de atraso. O servidor consome as vidas automaticamente, sem cobrar a mesma extensão duas vezes. Vidas não acumulam entre meses; um atraso antigo não ganha um novo saldo na virada do mês.</li>
   <li><strong>Quando acaba a proteção.</strong> A tentativa termina se o atraso exceder a carência e as vidas disponíveis. Recomeçar volta à etapa 1 e ao XP zero da tentativa; recorde e conquistas históricas permanecem.</li>
   <li><strong>XP e bônus.</strong> Cada capítulo confirmado vale 10 XP no novo regulamento. Vídeos e estudos são opcionais; não assistir não tira XP nem bloqueia a leitura. O cronômetro do vídeo é separado do prazo diário. A validação do bônus é feita pelo servidor, sem duplicação.</li></ol>
   <p><strong>Calendário:</strong> plano comum de 365 etapas, ou 366 no plano bissexto, incluindo 29 de fevereiro. Explorar qualquer marco é livre; iniciar uma leitura futura não é.</p>
  </details>
 </section>;
}
