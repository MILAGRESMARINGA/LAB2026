/** Fictional scores exclusively for the public simulation. Never submitted to the backend. */
export type DemoGame={chapters:string[];videos:string[];bonuses:string[];studies:string[];xp:number};
export const emptyDemoGame:DemoGame={chapters:[],videos:[],bonuses:[],studies:[],xp:0};
export function demoReward(state:DemoGame,kind:'chapter'|'video',id:string):DemoGame{
 const key=kind==='chapter'?'chapters':'videos';if(state[key].includes(id))return state;
 return {...state,[key]:[...state[key],id],xp:state.xp+(kind==='chapter'?10:5)};
}
export function demoRanking(xp:number,round=0,scope:'global'|'individual'='global'){
 const rivals=scope==='global'?[{name:'Ana Luz',xp:180},{name:'Pedro Alves',xp:120},{name:'Lia Santos',xp:75},{name:'Lucas Reis',xp:40}]:[{name:'Ana Luz · GC Esperança',xp:90},{name:'Lucas Reis · GC Esperança',xp:30}];
 return [...rivals.map((r,i)=>({...r,xp:r.xp+round*(i+1)*5,self:false})),{name:'Você',xp,self:true}].sort((a,b)=>b.xp-a.xp||Number(b.self)-Number(a.self));
}
