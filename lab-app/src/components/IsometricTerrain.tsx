import {ATLAS_PLACES,atlasProject} from '../domain/journey-atlas';
// Original vector terrain. Coordinates are schematic outlines of the Mediterranean basin.
const coasts=[
 '8,44 12,46 18,46 22,43 28,42 29,40 25,40 24,38 23,40 20,40 20,38 18,40 16,41 16,39 13,42 10,43 8,44',
 '27,41 34,42 41,41 48,38 52,32 49,28 44,25 40,26 36,30 35,34 34,36 29,36 27,38 27,41',
 '5,35 12,33 20,32 25,32 30,31 32,30 34,28 36,24 32,20 20,20 5,24 5,35',
 '34,30 36,29 35,27 34,29 34,30', '23,35 26,35 26,34.6 23,34.6 23,35',
 '32,35.5 34.5,35.6 33.5,34.6 32,35.5',
];
const polygon=(s:string)=>s.split(' ').map(pair=>{const [lon,lat]=pair.split(',').map(Number),p=atlasProject(lon,lat);return `${p.x},${p.y}`}).join(' ');
export function IsometricTerrain({id}:{id:string}){return <g aria-hidden="true">
 <defs><linearGradient id={`${id}-land`} x2="0.8" y2="1"><stop stopColor="#b8d870"/><stop offset=".46" stopColor="#8bb95b"/><stop offset="1" stopColor="#efc47b"/></linearGradient><pattern id={`${id}-waves`} width="60" height="40" patternUnits="userSpaceOnUse"><path d="M4 20q12 -7 24 0t24 0" stroke="#b9eff6" strokeWidth="2" fill="none" opacity=".25"/></pattern></defs>
 <rect width="1080" height="880" fill="#278daa"/><rect width="1080" height="880" fill={`url(#${id}-waves)`}/>
 {coasts.map((c,i)=><g key={i}><polygon points={polygon(c)} transform="translate(0 24)" fill="#694a32" stroke="#513f33" strokeWidth="3"/><polygon points={polygon(c)} transform="translate(0 13)" fill="#a57945"/><polygon points={polygon(c)} fill={`url(#${id}-land)`} stroke="#e6e3a1" strokeWidth="3"/></g>)}
 {[[31,23],[31.5,26],[31,29],[30,30.8]].slice(0,-1).map(([lon,lat],i,a)=>{const p=atlasProject(lon,lat),n=atlasProject(...([[31.5,26],[31,29],[30,30.8]][i] as [number,number]));return <path key={i} d={`M${p.x} ${p.y}Q${p.x+20} ${n.y} ${n.x} ${n.y}`} stroke="#4ad2e6" strokeWidth="9" fill="none"/>})}
 {[42,45].map((lon,i)=>{const p=atlasProject(lon,37),q=atlasProject(48,30);return <path key={lon} d={`M${p.x} ${p.y}Q${p.x-20+i*25} ${q.y-70} ${q.x} ${q.y}`} stroke="#49cfe5" strokeWidth="6" fill="none"/>})}
 {[[34,29],[32,39],[37,39],[44,37],[15,44],[48,34]].map(([lon,lat])=>{const p=atlasProject(lon,lat);return <g key={`${lon}-${lat}`} transform={`translate(${p.x} ${p.y})`}><ellipse cy="10" rx="34" ry="12" fill="#334f39" opacity=".25"/><path d="M-32 9L0 -60 32 9Z" fill="#a2b3ac"/><path d="M0 -60L32 9H3Z" fill="#637f7c"/><path d="M-12 -35L0 -60 12 -34 2 -39 -3 -30Z" fill="#f4f5df"/></g>})}
 {[[35,33],[37,35],[29,38],[23,41],[12,44],[33,32],[41,35]].map(([lon,lat])=>{const p=atlasProject(lon,lat);return <g key={`${lon}-${lat}`} transform={`translate(${p.x} ${p.y})`}><ellipse cy="10" rx="20" ry="8" fill="#3c6341" opacity=".3"/><path d="M0 10V-25" stroke="#946139" strokeWidth="7"/><path d="M-21 -15L0 -60 21 -15Z" fill="#368855"/><path d="M0 -60L21 -15H0Z" fill="#226a4b"/></g>})}
 {Object.values(ATLAS_PLACES).map(place=>{const p=atlasProject(place.lon,place.lat);return <g key={place.name} transform={`translate(${p.x} ${p.y})`}><circle r="4" fill="#fff8d9"/><text y="22" textAnchor="middle" fill="#173b3f" stroke="#f3eac2" strokeWidth="3" paintOrder="stroke" fontSize="13" fontWeight="800">{place.name}</text></g>})}
 <g fill="#e7f8fb" fontSize="18" fontWeight="800" letterSpacing="4"><text x="200" y="250">EUROPA</text><text x="720" y="290">ÁSIA</text><text x="220" y="750">ÁFRICA</text></g><text x="260" y="425" fill="#d6f5fa" fontSize="15" fontStyle="italic">Mar Mediterrâneo</text>
 </g>}
