import {CANON} from './canon';

/** Editorial anchors, not a claim that every chapter in a book has one date. */
export type HistoricalAnchor = {id:string;books:readonly number[];period:string;kingdom:string;rulers:string;prophets:string;empire:string;references:readonly string[]};
export const HISTORICAL_ANCHORS:readonly HistoricalAnchor[] = [
 {id:'united',books:[9,10,11,13,14],period:'Monarquia inicial · aproximadamente séculos XI–X a.C.',kingdom:'Reino unido, antes da divisão',rulers:'Saul, Davi e Salomão, em sucessão',prophets:'Samuel; Natã e Gade no reinado de Davi',empire:'Reinos regionais; conflitos com filisteus e outros vizinhos',references:['1Sm 9–10','2Sm 7','1Rs 1–11','1Cr 29.29']},
 {id:'divided',books:[11,12,14,28,30],period:'Reino dividido · aproximadamente séculos X–VIII a.C.',kingdom:'Norte: Israel / Samaria · Sul: Judá / Jerusalém',rulers:'Dinastias distintas; Jeroboão II em Israel e Uzias em Judá no contexto de Amós',prophets:'Elias e Eliseu em episódios de Reis; Amós e Oséias no século VIII',empire:'Pressão assíria crescente; Samaria cai no século VIII a.C.',references:['1Rs 12','2Rs 17','Os 1.1','Am 1.1']},
 {id:'judah',books:[12,14,23,33],period:'Judá e a Assíria · aproximadamente séculos VIII–VII a.C.',kingdom:'Judá; Israel do Norte antes de sua queda',rulers:'Uzias, Jotão, Acaz e Ezequias no cabeçalho de Isaías',prophets:'Isaías; Miqueias no tempo de Jotão, Acaz e Ezequias',empire:'Assírio; não confundir todos os oráculos com uma única campanha',references:['Is 1.1','Mq 1.1','2Rs 18–19']},
 {id:'exile',books:[12,14,24,25,26,27,35,36],period:'Queda de Jerusalém e exílio · aproximadamente séculos VII–VI a.C.',kingdom:'Judá e comunidades judaítas no exílio',rulers:'Josias e seus sucessores; Nabucodonosor na Babilônia',prophets:'Jeremias; Ezequiel entre os exilados; Daniel na narrativa da corte',empire:'Transição da pressão assíria para o domínio babilônico',references:['Jr 1.1–3','2Rs 24–25','Ez 1.1–3','Dn 1']},
 {id:'return',books:[15,16,17,37,38,39],period:'Retorno e reconstrução · aproximadamente séculos VI–V a.C.',kingdom:'Judá como comunidade sob domínio persa',rulers:'Ciro, Dario e Artaxerxes em fases diferentes; Zorobabel e Neemias como governadores',prophets:'Ageu e Zacarias no reinado de Dario; Malaquias no contexto pós-exílico',empire:'Persa',references:['Ed 1','Ed 5.1–2','Ag 1.1','Zc 1.1','Ne 2']},
 {id:'rome',books:[40,41,42,43,44],period:'Jesus e a missão apostólica · século I d.C.',kingdom:'Judéia, Galiléia e províncias do Mediterrâneo',rulers:'Herodes e seus sucessores; governadores romanos em momentos distintos',prophets:'João Batista; profetas e mestres nas comunidades de Atos',empire:'Romano',references:['Lc 3.1–2','At 13.1','At 18.12']},
];
export type AtlasEntry={id:string;title:string;books:readonly number[];references:readonly string[];note:string};
/** Original catalog only. No scanned, third-party or purportedly licensed map images. */
export const BIBLICAL_ATLAS:readonly AtlasEntry[] = [
 {id:'ancient',title:'Mundo antigo e caminhos patriarcais',books:[1],references:['Gn 11–12'],note:'Mesopotâmia, Ur, Harã e Canaã; localização de alguns sítios é discutida.'},
 {id:'exodus',title:'Egito, Sinai e o Êxodo',books:[2,3,4,5],references:['Êx 12–19','Nm 33'],note:'Rotas e identificação do Sinai têm propostas diferentes; não há traçado único comprovado.'},
 {id:'tribes',title:'Divisão das doze tribos',books:[6,7],references:['Js 13–21'],note:'Limites descritos no texto; ocupação territorial variou ao longo do tempo.'},
 {id:'united',title:'Reinos de Saul, Davi e Salomão',books:[9,10,11,13,14],references:['2Sm 8','1Rs 4'],note:'Distinguir território administrado, vassalagem e influência.'},
 {id:'divided',title:'Israel e Judá: Norte e Sul',books:[11,12,14,23,28,30,33],references:['1Rs 12','2Rs 17'],note:'Samaria e Jerusalém pertencem a reinos distintos depois da divisão.'},
 {id:'assyria',title:'Expansão assíria',books:[12,23,32,34],references:['2Rs 18–19','Is 36–37'],note:'O mapa depende da campanha e do período selecionados.'},
 {id:'empires',title:'Babilônia, Pérsia e mundo grego',books:[15,16,17,24,26,27],references:['2Rs 25','Ed 1','Dn 8'],note:'Três períodos diferentes, sem representar todos como um império simultâneo.'},
 {id:'roman',title:'Império Romano e províncias',books:[40,41,42,43,44,45],references:['Lc 2–3','At 18'],note:'Fronteiras e nomes administrativos mudam com a data.'},
 {id:'landscape',title:'Relevo, clima e vegetação da terra bíblica',books:[5,6,19,40,41,42,43],references:['Dt 8.7–10','Sl 104'],note:'Regiões e estações; reconstruções ambientais são aproximadas.'},
 {id:'jesus',title:'Palestina nos tempos de Jesus',books:[40,41,42,43],references:['Mt 4','Jo 4'],note:'Galiléia, Samaria, Judéia, Peréia e Decápolis como referências regionais.'},
 {id:'paul',title:'Viagens missionárias de Paulo e viagem a Roma',books:[44,45,46,47,48,49,50,51,52,53],references:['At 13–14','At 15.36–18.22','At 18.23–21.17','At 27–28'],note:'Quatro itinerários distintos; certos portos e trechos marítimos têm identificação discutida.'},
 {id:'jerusalem-at',title:'Jerusalém do Antigo Testamento',books:[10,11,12,13,14,16,19,23,24],references:['2Sm 5','Ne 3'],note:'Cidade de Davi, expansões e muralhas pertencem a fases diferentes.'},
 {id:'jerusalem-nt',title:'Jerusalém nos tempos de Jesus',books:[40,41,42,43,44],references:['Lc 22–24','Jo 18–20'],note:'Templo, Oliveiras e Cedrom; identificação de locais da paixão inclui propostas tradicionais.'},
 {id:'ezekiel-temple',title:'Planta da visão do templo de Ezequiel',books:[26],references:['Ez 40–48'],note:'Planta da visão literária, não uma planta arqueológica de edifício escavado.'},
];
export type AncientMeasure={id:string;label:string;kind:'length'|'mass'|'capacity'|'wage'|'coin';minimum:number;maximum:number;unit:string;context:string;reference:string};
export const ANCIENT_MEASURES:readonly AncientMeasure[] = [
 {id:'cubit',label:'Côvado comum',kind:'length',minimum:.45,maximum:.46,unit:'m',context:'Estimativa convencional; não substitui o côvado longo de Ezequiel.',reference:'Ez 40.5'},
 {id:'long-cubit',label:'Côvado longo de Ezequiel',kind:'length',minimum:.525,maximum:.53,unit:'m',context:'Côvado comum mais um palmo menor; uso em Ez 40–48.',reference:'Ez 40.5'},
 {id:'handbreadth',label:'Palmo menor',kind:'length',minimum:.075,maximum:.075,unit:'m',context:'Aproximação de largura da mão.',reference:'Ez 40.5'},
 {id:'reed',label:'Cana de Ezequiel (seis côvados longos)',kind:'length',minimum:3.15,maximum:3.18,unit:'m',context:'O comprimento depende do côvado longo adotado.',reference:'Ez 40.5'},
 {id:'roman-pound',label:'Libra romana',kind:'mass',minimum:.327,maximum:.328,unit:'kg',context:'Litra em João; não confundir com libra moderna.',reference:'Jo 12.3; 19.39'},
 {id:'shekel',label:'Siclo — padrões históricos diferentes',kind:'mass',minimum:.0114,maximum:.0164,unit:'kg',context:'Intervalo de padrões documentados; não é valor único nem cotação de prata.',reference:'Êx 30.13; Ez 45.12'},
 {id:'ephah',label:'Efa / bato — estimativas',kind:'capacity',minimum:22,maximum:37,unit:'L',context:'Fontes e padrões diferem; efa e bato têm equivalência no texto.',reference:'Ez 45.10–11'},
 {id:'homer',label:'Ômer / coro (dez efas)',kind:'capacity',minimum:220,maximum:370,unit:'L',context:'Não confundir ômer/coro com gômer de Êxodo 16.',reference:'Ez 45.11–14'},
 {id:'omer',label:'Gômer (décima parte de efa)',kind:'capacity',minimum:2.2,maximum:3.7,unit:'L',context:'Mantém o mesmo padrão da efa selecionada.',reference:'Êx 16.36'},
 {id:'gerah',label:'Gera (1/20 de siclo)',kind:'mass',minimum:.00057,maximum:.00082,unit:'kg',context:'Varia com o padrão do siclo; 0,57 g no padrão de 11,4 g.',reference:'Êx 30.13'},
 {id:'mina-at',label:'Mina / arrátel do AT — verificar tradução',kind:'mass',minimum:.57,maximum:.984,unit:'kg',context:'Mina de 50 ou 60 siclos, conforme o sistema; arrátel não é nome uniforme em todas as traduções.',reference:'1Rs 10.17; Ez 45.12'},
 {id:'talent-at',label:'Talento do AT — vários padrões',kind:'mass',minimum:34.272,maximum:59,unit:'kg',context:'Estimativas históricas distintas; o metal e o padrão precisam ser identificados.',reference:'Êx 38.24–26'},
 {id:'talent-nt-weight',label:'Talento como peso no NT',kind:'mass',minimum:41,maximum:59,unit:'kg',context:'Estimativas do peso em Apocalipse; não confundir com a unidade monetária das parábolas.',reference:'Ap 16.21'},
 {id:'denarius-silver',label:'Denário — massa aproximada da moeda',kind:'mass',minimum:.0038,maximum:.004,unit:'kg',context:'Massa aproximada; teor e peso variam. Não é cotação em dinheiro atual.',reference:'Mt 22.19'},
 {id:'tyrian-shekel',label:'Siclo fenício / tírio — padrão pesado',kind:'mass',minimum:.0144,maximum:.0146,unit:'kg',context:'Padrão associado ao tributo do templo; a identificação das trinta moedas é interpretação histórica.',reference:'Mt 17.24–27; 26.15'},
 {id:'span',label:'Palmo comum',kind:'length',minimum:.2221,maximum:.225,unit:'m',context:'Medida convencional de uma mão aberta; duas vezes o palmo formam um côvado.',reference:'Êx 28.16'},
 {id:'long-span',label:'Palmo no sistema longo de Ezequiel',kind:'length',minimum:.2591,maximum:.265,unit:'m',context:'Metade do côvado longo; não confundir com palmo menor.',reference:'Ez 43.13'},
 {id:'fathom',label:'Braça',kind:'length',minimum:1.8,maximum:1.85,unit:'m',context:'Medida aproximada de braços abertos.',reference:'At 27.28'},
 {id:'stadion',label:'Estádio',kind:'length',minimum:180,maximum:185,unit:'m',context:'Comprimento aproximado conforme o padrão utilizado.',reference:'Jo 11.18'},
 {id:'roman-mile',label:'Milha romana',kind:'length',minimum:1478,maximum:1480,unit:'m',context:'Não equivale à milha inglesa moderna.',reference:'Mt 5.41'},
 {id:'sabbath-walk',label:'Caminho de um sábado',kind:'length',minimum:800,maximum:1109,unit:'m',context:'Estimativas para dois mil côvados; não uma distância moderna exata.',reference:'At 1.12'},
 {id:'log',label:'Logue (1/12 de him)',kind:'capacity',minimum:22/72,maximum:37/72,unit:'L',context:'Varia com o padrão do bato adotado.',reference:'Lv 14.10; Ez 45.24'},
 {id:'hin',label:'Him (1/6 de bato)',kind:'capacity',minimum:22/6,maximum:37/6,unit:'L',context:'Doze logues; diferentes estimativas do bato produzem equivalências distintas.',reference:'Êx 29.40; Ez 45.24'},
 {id:'seah',label:'Seá / sato (1/3 de efa)',kind:'capacity',minimum:22/3,maximum:37/3,unit:'L',context:'Medida seca; as três medidas em Mt 13 correspondem a três satos.',reference:'Gn 18.6; Mt 13.33'},
 {id:'modius',label:'Alqueire / módio romano',kind:'capacity',minimum:8.75,maximum:8.75,unit:'L',context:'Estimativa do recipiente romano; não equivale aos alqueires regionais modernos.',reference:'Mt 5.15'},
 {id:'metretes',label:'Metreta',kind:'capacity',minimum:39.3,maximum:40,unit:'L',context:'Cada talha em João comportava duas ou três metretas, não apenas uma.',reference:'Jo 2.6'},
 {id:'assarion',label:'Assário — escala monetária convencional',kind:'coin',minimum:1/16,maximum:1/16,unit:'denário(s), na escala convencional',context:'Algumas fontes propõem outra razão histórica; não é conversão moderna.',reference:'Mt 10.29'},
 {id:'quadrans',label:'Quadrante / ceitil',kind:'coin',minimum:1/64,maximum:1/64,unit:'denário(s), na escala convencional',context:'Um quarto de assário; ceitil é termo tradicional de tradução, não moeda romana diferente.',reference:'Mt 5.26; Mc 12.42'},
 {id:'lepton',label:'Lepto / moeda da viúva',kind:'coin',minimum:1/128,maximum:1/128,unit:'denário(s), na escala convencional',context:'Dois leptos equivalem a um quadrante no texto de Marcos.',reference:'Mc 12.42'},
 {id:'drachma',label:'Dracma — equivalência monetária',kind:'coin',minimum:1,maximum:1,unit:'denário(s), aproximadamente',context:'Equivalência convencional de valor; não impõe uma massa universal de prata.',reference:'Lc 15.8'},
 {id:'stater',label:'Estáter / siclo — tributo do templo',kind:'coin',minimum:4,maximum:4,unit:'dracma(s), na escala convencional',context:'Duas didracmas; moeda suficiente para o tributo de duas pessoas.',reference:'Mt 17.24–27'},
 {id:'talent-nt-money',label:'Talento monetário do NT',kind:'coin',minimum:6000,maximum:6000,unit:'denário(s), na escala convencional',context:'Sessenta minas de cem denários; não equivale a 12,6 kg por regra universal.',reference:'Mt 18.24; 25.15'},
 {id:'denarius',label:'Denário — diária no exemplo da parábola',kind:'wage',minimum:1,maximum:1,unit:'diária no exemplo de Mt 20',context:'Comparação narrativa; não é salário universal nem conversão em reais.',reference:'Mt 20.2'},
];
export const CONTEXT_SOURCES = [
 {label:'Robert G. Bratcher, Weights, Money, Measures and Time (1959), acervo UBS',url:'https://translation.bible/wp-content/uploads/2024/05/bratcher-1959-weights-money-measures-and-time.pdf'},
 {label:'Ezequiel 45.11: notas de tradução sobre efa e bato',url:'https://www.biblegateway.com/passage/?search=Ezekiel+45%3A11-13&version=CEV'},
 {label:'Ezequiel 40.5: notas de tradução sobre o côvado',url:'https://www.biblegateway.com/passage/?search=Ezekiel+40%3A5&version=NIV'},
] as const;
export function contextForChapter(chapterId:string){
 const match=/^([1-9]|[1-5][0-9]|6[0-6]):([1-9][0-9]{0,2})$/.exec(chapterId);
 const book=match?Number(match[1]):0,chapter=match?Number(match[2]):0;
 if(!book||chapter>CANON[book-1][1])return {timeline:[],atlas:[]};
 return {timeline:HISTORICAL_ANCHORS.filter(item=>item.books.includes(book)),atlas:BIBLICAL_ATLAS.filter(item=>item.books.includes(book))};
}
export function convertAncientMeasure(measureId:string,quantity:number):{minimum:number;maximum:number;unit:string}|null{
 const measure=ANCIENT_MEASURES.find(item=>item.id===measureId);
 if(!measure||!Number.isFinite(quantity)||quantity<0||quantity>1_000_000)return null;
 return {minimum:quantity*measure.minimum,maximum:quantity*measure.maximum,unit:measure.unit};
}

export const BIBLICAL_TIME_NOTES = [
 {id:'seasonal-hours',title:'Doze horas de luz',explanation:'A parte clara do dia podia ser dividida em doze horas, contadas a partir do nascer do sol. A duração dessas horas variava com a estação; a hora sexta indica aproximadamente o meio do dia, não um fuso horário moderno.',references:'Jo 11.9; Mt 20.1–12'},
 {id:'night-watches',title:'Vigílias da noite',explanation:'O sistema hebraico é descrito com três vigílias; o sistema romano, com quatro. Marcos menciona tarde, meia-noite, canto do galo e manhã. A passagem precisa ser lida em seu contexto; não se aplica uma tabela única a todo o AT ou NT.',references:'Jz 7.19; Mc 13.35; Lc 12.38'},
] as const;
