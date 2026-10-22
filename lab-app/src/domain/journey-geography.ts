import type {Chapter} from './canon';
import type {GameDay} from './game-plan';

export type JourneyContext={name:string;region:string;detail:string;reference:string;kind:'narrativa'|'destinatários'|'panorama'|'simbólico';x:number};
const place=(name:string,region:string,detail:string,reference:string,x:number,kind:JourneyContext['kind']='narrativa'):JourneyContext=>({name,region,detail,reference,x,kind});
/** Textual settings and recipients, not purported coordinates of every verse. */
export function chapterJourneyContext(ch:Pick<Chapter,'book'|'chapter'>):JourneyContext{
 const {book:b,chapter:c}=ch;
 if(b==='Gênesis'){
  if(c<=11)return place('Origens','Mundo bíblico','Criação, humanidade e povos. O marco é simbólico: o texto não permite localizar o Éden em um ponto comprovado.','Gn 1–11',360,'simbólico');
  if(c===12)return place('Harã → Canaã','Caminhos patriarcais','Abrão parte de Harã e chega a Canaã; o capítulo também narra sua descida ao Egito.','Gn 12',480);
  if(c>=39&&c<=47)return place('Egito','Vale do Nilo','José, a fome e a chegada da família de Jacó ao Egito.','Gn 39–47',200);
  if(c>=28&&c<=31)return place('Canaã e Padã-Arã','Caminhos de Jacó','A viagem de Jacó passa por Betel e pela região de sua família em Padã-Arã.','Gn 28–31',490);
  return place('Canaã e regiões vizinhas','Caminhos patriarcais','Promessa, família e aliança nas narrativas patriarcais. Há deslocamentos; consulte os lugares nomeados em cada capítulo.','Gn 13–50',400,'panorama');
 }
 if(b==='Êxodo')return c<=12?place('Egito','Vale do Nilo','Escravidão, chamado de Moisés e Páscoa antecedem a saída do povo.','Êx 1–12',200):c<19?place('Caminho do deserto','Egito e Sinai','A saída do Egito e a caminhada até o Sinai. O mapa de jogo não pretende estabelecer a rota arqueológica.','Êx 13–18',300):place('Sinai','Deserto','Aliança, instruções e tabernáculo no contexto do Sinai; a identificação moderna do monte é debatida.','Êx 19; 40',340);
 if(b==='Levítico')return place('Sinai','Deserto','Instruções de culto, pureza e santidade dadas no contexto do tabernáculo.','Lv 1.1; 27.34',340);
 if(b==='Números')return place(c<=10?'Sinai':'Deserto e Moabe','Caminhada de Israel','Acampamentos e deslocamentos rumo às campinas de Moabe; os locais variam durante o livro.','Nm 1.1; 10; 33; 36.13',380,'panorama');
 if(b==='Deuteronômio')return place('Moabe','A leste do Jordão','Moisés relembra a aliança antes da entrada na terra.','Dt 1.1–5; 34',470);
 if(b==='Josué')return place('Canaã','Terra e aliança','Travessia do Jordão, entrada na terra e distribuição das tribos.','Js 1–4; 13–21',400,'panorama');
 if(b==='Juízes')return place('Territórios de Israel','Terra e aliança','As narrativas percorrem diferentes tribos e regiões; cada episódio tem seu cenário.','Jz 1–3',390,'panorama');
 if(b==='Rute')return place('Belém e Moabe','Terra e família','A família retorna de Moabe a Belém; acolhimento e redenção marcam a narrativa.','Rt 1–4',420,'panorama');
 if(['1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas'].includes(b))return place('Israel e Judá','Reinos e profetas','Reinos, cidades e governantes mudam ao longo do texto. Jerusalém e Samaria são centros de fases diferentes, não um único reino permanente.','1Sm 8; 2Sm 5; 1Rs 12; 2Rs 17; 25',400,'panorama');
 if(['Esdras','Neemias'].includes(b))return place('Jerusalém','Retorno e reconstrução','Retorno sob domínio persa, reconstrução e vida da comunidade em Jerusalém.','Ed 1; Ne 2',400);
 if(b==='Ester')return place('Susã','Império Persa','A história de Ester se passa na corte persa em Susã.','Et 1–2',580);
 if(b==='Jó')return place('Terra de Uz','Sabedoria','O livro nomeia Uz; sua localização exata não é estabelecida pelo mapa.','Jó 1.1',480,'panorama');
 if(['Salmos','Provérbios','Eclesiastes','Cântico dos Cânticos'].includes(b))return place('Poesia e sabedoria','Israel · panorama literário','Orações, poesia e sabedoria não correspondem a uma viagem por uma cidade a cada capítulo. Este marco representa o encontro de leitura.','Sl 1; Pv 1; Ec 1; Ct 1',400,'panorama');
 if(b==='Daniel')return place('Babilônia e corte imperial','Exílio','Daniel e seus companheiros vivem no contexto dos impérios babilônico e medo-persa. As visões possuem alcance além da cidade.','Dn 1; 5–6',580,'panorama');
 if(b==='Ezequiel')return place('Exilados na Babilônia','Exílio','Ezequiel é chamado entre os exilados junto ao rio Quebar. As visões também se referem a Jerusalém e outras nações.','Ez 1.1–3; 8',580,'panorama');
 if(b==='Jonas'||b==='Naum')return place('Nínive','Assíria','Nínive é a cidade de destino de Jonas e tema do anúncio de Naum; isso não identifica o local de composição.','Jn 1.2; 3; Na 1.1',550,'panorama');
 if(['Isaías','Jeremias','Lamentações','Oséias','Joel','Amós','Obadias','Miquéias','Habacuque','Sofonias','Ageu','Zacarias','Malaquias'].includes(b))return place('Israel, Judá e nações','Profetas','O cenário profético inclui diferentes épocas e destinatários. Leia o cabeçalho e os nomes do capítulo para situar o anúncio.','Is 1.1; Jr 1.1–3; Os 1.1; Ag 1.1',410,'panorama');
 if(['Mateus','Marcos','Lucas','João'].includes(b))return place('Galileia, Samaria e Judeia','Caminhos de Jesus','O ministério de Jesus percorre várias localidades; este é o panorama regional do Evangelho, não uma localização única para todo capítulo.','Mt 4; Lc 3; Jo 4',390,'panorama');
 if(b==='Atos')return place('Jerusalém → Mediterrâneo','Missão apostólica','O testemunho avança de Jerusalém a outras regiões e chega a Roma. Consulte a viagem narrada no capítulo.','At 1.8; 13–14; 27–28',290,'panorama');
 const destinations:Record<string,[string,string,string,number]>={
  'Romanos':['Roma','Itália','Rm 1.7',150], '1 Coríntios':['Corinto','Grécia','1Co 1.2',230], '2 Coríntios':['Corinto','Grécia','2Co 1.1',230],
  'Gálatas':['Galácia','Ásia Menor','Gl 1.2',430], 'Efésios':['Éfeso','Ásia Menor · atual Turquia','Ef 1.1',350],
  'Filipenses':['Filipos','Macedônia','Fp 1.1',250], 'Colossenses':['Colossos','Ásia Menor','Cl 1.2',390],
  '1 Tessalonicenses':['Tessalônica','Macedônia','1Ts 1.1',260], '2 Tessalonicenses':['Tessalônica','Macedônia','2Ts 1.1',260],
  'Tito':['Creta','Mediterrâneo','Tt 1.5',300], 'Apocalipse':['Patmos e sete igrejas','Mar Egeu e Ásia Menor','Ap 1.4,9–11',330]
 };
 const d=destinations[b];
 if(d)return place(d[0],d[1],b==='Apocalipse'?'João identifica Patmos e dirige o livro às sete igrejas da Ásia. As visões não constituem um itinerário geográfico.':`Comunidade destinatária de ${b}${b==='Efésios'?' e região ao redor de Éfeso, tradicionalmente associadas à carta':''}. O destino da carta não indica necessariamente onde ela foi escrita.`,d[2],d[3],b==='Apocalipse'?'panorama':'destinatários');
 return place('Comunidades cristãs','Mundo do Novo Testamento','Carta estudada em seu contexto e destinatários; não atribuímos uma cidade de composição sem base no texto.','Leia a apresentação e a saudação da carta.',360,'panorama');
}
export function stageJourneyContexts(day:GameDay):JourneyContext[]{
 const unique=new Map<string,JourneyContext>();
 for(const chapter of day.chapters){const context=chapterJourneyContext(chapter);unique.set(context.name,context)}
 return [...unique.values()];
}
export function journeyPoint(day:GameDay,index:number,overview=false){
 if(overview){const row=Math.floor(index/16),col=index%16;return {x:44+(row%2?15-col:col)*42,y:90+row*54}}
 const chapter=day.old[0]??day.chapters[0];
 const primary=chapter?chapterJourneyContext(chapter):{x:360};
 return {x:Math.max(125,Math.min(595,primary.x+Math.sin(index*.78)*95)),y:180+index*145};
}
export function journeyCalendarLabel(day:number,length:number){
 // A calendar reference, never a deadline or a substitute for server activation time.
 const year=length===366?2028:2027;
 return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(year,0,day)));
}
