import {CANON,CHAPTERS} from './canon';

/** A reading episode is editorial navigation, never a replacement for the annual plan. */
export type JourneyStory={
 readonly id:string;readonly title:string;readonly period:string;readonly person:string;
 readonly summary:string;readonly reference:string;readonly book:string;
 readonly fromChapter:number;readonly toChapter:number;readonly placeName?:string;
 readonly kind:'narrative'|'literary'|'prophetic'|'letter'|'vision';
};
export const STORY_CONTEXT_NOTICES={
 order:'A ordem dos livros não equivale à data de todos os acontecimentos. Os episódios ajudam a acompanhar a leitura sem reorganizar o plano anual.',
 parallel:'Samuel, Reis e Crônicas podem narrar acontecimentos relacionados por perspectivas diferentes; isso não cria duas viagens históricas sucessivas.',
 prophets:'Cada profeta é relacionado ao contexto indicado pelo texto. Datas e vínculos históricos discutidos permanecem identificados, sem sincronizações automáticas por proximidade entre livros.',
 geography:'Lugar citado, cenário do relato e local de composição são informações diferentes. Coordenadas incertas são referências regionais, não locais comprovados.',
 intercalated:'A leitura do dia pode reunir histórias de épocas e regiões diferentes. Trocar a leitura em foco muda o contexto exibido, sem embaralhar sua sequência de capítulos.',
} as const;
const records:JourneyStory[]=[];
function episode(book:string,fromChapter:number,toChapter:number,id:string,title:string,period:string,person:string,summary:string,placeName?:string,kind:JourneyStory['kind']='narrative'){
 records.push(Object.freeze({book,fromChapter,toChapter,id,title,period,person,summary,placeName,kind,reference:`${book} ${fromChapter}${toChapter===fromChapter?'':`–${toChapter}`}`}));
}
// Gênesis deliberately keeps transitions between generations visible. A chapter may contain more than one family episode.
episode('Gênesis',1,2,'origins','O começo da história','Origens','Deus e a humanidade','A criação e o jardim abrem a narrativa bíblica. O marco do Éden situa o contexto do relato sem afirmar uma localização comprovada.','Éden · localização não estabelecida');
episode('Gênesis',3,5,'humanity','A humanidade fora do jardim','Origens','Adão, Eva e seus descendentes','Acompanhe a desobediência, suas consequências e as gerações que antecedem Noé.');
episode('Gênesis',6,9,'noah','Noé e o dilúvio','Origens','Noé e sua família','A arca, o dilúvio e a aliança pertencem ao mesmo episódio. A incerteza de localização não altera a distinção entre relato e hipótese cartográfica.','Regiões das origens e montes de Ararate');
episode('Gênesis',10,11,'peoples-babel','Povos, Babel e o caminho de Abrão','Origens e início dos patriarcas','Povos e família de Terá','Os povos e Babel antecedem a apresentação da família que segue de Ur para Harã.','Mesopotâmia');
episode('Gênesis',12,18,'abraham-promise','Abraão: chamado e promessa','Patriarcas','Abraão e Sara','Acompanhe a família chamada a sair de sua terra e os episódios da promessa em Canaã.','Canaã e regiões da viagem');
episode('Gênesis',19,19,'lot','Ló e as cidades do vale','Patriarcas','Ló e sua família','Este episódio pertence ao contexto de Abraão, mas acompanha Ló. O mapa não fixa sítios arqueológicos debatidos.','Região do vale do Jordão');
episode('Gênesis',20,24,'abraham-isaac','A família de Abraão e o futuro de Isaque','Patriarcas','Abraão, Sara e Isaque','Nascimento de Isaque, provação de Abraão, morte de Sara e formação da nova família.');
episode('Gênesis',25,25,'generation-transition','De Abraão a Isaque e seus filhos','Patriarcas','Abraão, Isaque, Esaú e Jacó','O capítulo reúne a morte de Abraão, genealogias e a apresentação dos filhos de Isaque; não é um único deslocamento.');
episode('Gênesis',26,26,'isaac','Isaque e a promessa recebida','Patriarcas','Isaque e Rebeca','Acompanhe os episódios de Isaque, os poços e a continuidade da promessa.','Região de Gerar e Berseba');
episode('Gênesis',27,33,'jacob-journey','Jacó: partida e retorno','Patriarcas','Jacó, Esaú e a família','Conflito entre irmãos, viagem, formação da família e retorno a Canaã.','Canaã, Harã e retorno');
episode('Gênesis',34,36,'jacob-family','A família de Jacó e os descendentes de Esaú','Patriarcas','Jacó e sua família','Os episódios da família e a genealogia de Esaú encerram esta parte da caminhada.');
episode('Gênesis',37,37,'joseph-sold','José é levado ao Egito','Família de Jacó no Egito','José e seus irmãos','O conflito entre irmãos leva José para longe de sua família.','Canaã → Egito');
episode('Gênesis',38,38,'judah-tamar','Judá e Tamar','Família de Jacó','Judá e Tamar','A narrativa acompanha Judá e Tamar antes de retomar a história de José; não é um novo estágio da viagem de José.','Canaã');
episode('Gênesis',39,45,'joseph-egypt','José no Egito','Família de Jacó no Egito','José e seus irmãos','Da casa de Potifar à administração dos alimentos e ao reencontro com os irmãos.','Egito');
episode('Gênesis',46,50,'family-egypt','A família chega ao Egito','Família de Jacó no Egito','Jacó, José e seus irmãos','A família se reúne no Egito; bênçãos, despedidas e promessa de retorno encerram Gênesis.','Egito e retorno funerário a Canaã');
// Êxodo follows the narrative's movement rather than assigning a different city to every chapter.
episode('Êxodo',1,2,'moses-beginnings','O povo oprimido e o nascimento de Moisés','Êxodo','Moisés e Israel','A opressão no Egito e os primeiros episódios da vida de Moisés preparam a libertação.','Egito e Midiã');
episode('Êxodo',3,6,'moses-call','Moisés recebe uma missão','Êxodo','Moisés e Arão','O chamado, o retorno ao Egito e o confronto inicial com o faraó.','Midiã e Egito');
episode('Êxodo',7,12,'passover','O confronto com o faraó e a Páscoa','Êxodo','Moisés, Arão e Israel','As pragas e a Páscoa antecedem a saída do povo.','Egito');
episode('Êxodo',13,18,'exodus-route','A saída do Egito e o caminho no deserto','Êxodo','Moisés e Israel','O povo parte e caminha até o Sinai. As rotas exibidas são reconstruções aproximadas.','Egito → Sinai');
episode('Êxodo',19,24,'sinai-covenant','A aliança no Sinai','Aliança e tabernáculo','Moisés e Israel','O povo se reúne no Sinai, recebe instruções e participa da aliança.','Sinai');
episode('Êxodo',25,31,'tabernacle-instructions','O tabernáculo é apresentado','Aliança e tabernáculo','Moisés e Israel','Instruções do santuário e do serviço de culto; esta seção não descreve uma viagem.','Sinai','literary');
episode('Êxodo',32,34,'covenant-renewal','Infidelidade, intercessão e renovação','Aliança e tabernáculo','Moisés e Israel','O bezerro de ouro e a intercessão são acompanhados pela renovação da aliança.','Sinai');
episode('Êxodo',35,40,'tabernacle-built','O tabernáculo é construído','Aliança e tabernáculo','Israel e os artesãos','A comunidade prepara e ergue o tabernáculo.','Sinai');
episode('Levítico',1,27,'leviticus','Aprendendo a viver como povo da aliança','Aliança e tabernáculo','Moisés e Israel','Instruções de culto, pureza e santidade. O mapa mantém o contexto do acampamento, sem inventar deslocamentos.','Sinai','literary');
episode('Números',1,10,'numbers-camp','O acampamento se prepara para partir','Deserto','Moisés e Israel','Organização, instruções e preparação do povo; o capítulo 10 inclui a partida.','Sinai e início da caminhada');
episode('Números',11,20,'numbers-wilderness','Provações durante a caminhada','Deserto','Moisés e Israel','Queixas, conflitos e decisões marcam os episódios do deserto.','Desertos e Cades');
episode('Números',21,36,'numbers-moab','Às portas da terra','Deserto e chegada a Moabe','Moisés e Israel','A caminhada chega a Moabe, onde o povo recebe instruções antes da entrada em Canaã.','Moabe e regiões da viagem');
episode('Deuteronômio',1,33,'moses-farewell','Moisés relembra a aliança','Preparação para a entrada','Moisés e Israel','Discursos recordam o passado e orientam a vida futura. Lugares lembrados não são automaticamente o local da fala.','Moabe','literary');
episode('Deuteronômio',34,34,'moses-death','A despedida de Moisés','Preparação para a entrada','Moisés e Josué','A morte de Moisés encerra o livro e prepara a continuidade sob Josué.','Região do monte Nebo');
episode('Josué',1,5,'joshua-crossing','Josué conduz a travessia','Entrada em Canaã','Josué e Israel','Preparação, travessia do Jordão e primeiros acampamentos.','Moabe, Jordão e Canaã');
episode('Josué',6,12,'joshua-campaigns','Os primeiros confrontos em Canaã','Entrada em Canaã','Josué e Israel','Os relatos percorrem cidades e regiões distintas; cada leitura mantém seus próprios lugares.','Canaã');
episode('Josué',13,22,'tribal-settlement','A terra é distribuída entre as tribos','Distribuição da terra','Josué e as tribos','A distribuição territorial envolve os dois lados do Jordão; fronteiras do modelo são esquemáticas.','Territórios das tribos');
episode('Josué',23,24,'joshua-farewell','A despedida de Josué','Distribuição da terra','Josué e Israel','Exortações finais e compromisso do povo encerram o livro.','Canaã');
episode('Juízes',1,3,'judges-introduction','Israel no tempo dos juízes','Juízes','Israel e os primeiros juízes','A introdução apresenta o contexto de infidelidade, opressão e livramento.','Territórios de Israel');
episode('Juízes',4,5,'deborah','Débora e Baraque','Juízes','Débora, Baraque e Jael','Um episódio de livramento é contado e depois celebrado em cântico.','Norte de Israel');
episode('Juízes',6,9,'gideon','Gideão e seus desdobramentos','Juízes','Gideão, sua família e Abimeleque','O livramento e seus desdobramentos familiares e políticos.','Israel');
episode('Juízes',10,12,'jephthah','Jefté e os conflitos da região','Juízes','Jefté e Israel','Os relatos situam conflitos e lideranças de Israel.','Gileade e regiões vizinhas');
episode('Juízes',13,16,'samson','A história de Sansão','Juízes','Sansão','Nascimento, escolhas e conflitos de Sansão no contexto filisteu.','Planície dos filisteus');
episode('Juízes',17,21,'judges-epilogue','A desordem entre as tribos','Juízes','Famílias e tribos de Israel','Episódios finais ilustram a crise do período. A ordem editorial não fixa a data de cada episódio.','Israel');
episode('Rute',1,4,'ruth','Rute: retorno, acolhimento e redenção','Tempo dos juízes','Rute, Noemi e Boaz','A família retorna de Moabe a Belém; Rute pertence ao tempo dos juízes, não a uma época posterior por vir depois do livro.','Moabe → Belém');
episode('1 Samuel',1,8,'samuel','Samuel e a transição para a monarquia','Samuel e início da monarquia','Samuel e Israel','O chamado de Samuel e a vida do povo antecedem o pedido por um rei.','Israel');
episode('1 Samuel',9,15,'saul','Saul assume o reinado','Início da monarquia','Saul e Samuel','A escolha de Saul e os primeiros acontecimentos de seu reinado.','Israel');
episode('1 Samuel',16,31,'david-saul','Davi e Saul','Início da monarquia','Davi, Saul e Jônatas','A apresentação de Davi, suas relações e os conflitos até a morte de Saul.','Israel e regiões de refúgio');
episode('2 Samuel',1,4,'david-hebron','Davi reina em Hebrom','Monarquia','Davi e a casa de Saul','A transição após a morte de Saul precede a unificação sob Davi.','Hebrom e Israel');
episode('2 Samuel',5,10,'david-jerusalem','Davi e Jerusalém','Monarquia','Davi','Jerusalém torna-se centro do reinado de Davi.','Jerusalém');
episode('2 Samuel',11,24,'david-family','Davi: pecado, conflitos e consequências','Monarquia','Davi e sua família','Os episódios pessoais e políticos do reinado devem ser lidos no próprio contexto.','Judá, Israel e regiões vizinhas');
episode('1 Reis',1,11,'solomon','O reinado de Salomão','Monarquia','Salomão','Sucessão, construção do templo e acontecimentos do reinado. Reconstruções do templo são modelos interpretativos.','Jerusalém');
episode('1 Reis',12,16,'kingdom-division','Israel e Judá seguem caminhos distintos','Reinos divididos','Reis de Israel e Judá','A divisão do reino exige distinguir o norte e o sul, e situar cada leitura no reino correspondente.','Israel e Judá');
episode('1 Reis',17,22,'elijah','Elias no tempo dos reis','Reinos divididos','Elias e os reis','O ministério de Elias aparece dentro da narrativa dos reinos.','Israel e regiões vizinhas');
episode('2 Reis',1,13,'elisha','Eliseu e os reinos de Israel e Judá','Reinos divididos','Elias, Eliseu e os reis','Sucessão profética, episódios de Eliseu e acontecimentos dos dois reinos.','Israel e Judá');
episode('2 Reis',14,17,'israel-fall','Os últimos reinados de Israel','Reinos divididos','Reis de Israel e Judá','A narrativa chega à queda do reino do norte e à deportação.','Israel e Assíria');
episode('2 Reis',18,23,'judah-final-kings','Judá entre crises e reformas','Últimos reinados de Judá','Ezequias, Josias e seus sucessores','Crises, reformas e acontecimentos que antecedem a queda de Jerusalém.','Judá');
episode('2 Reis',24,25,'jerusalem-fall','Jerusalém e o exílio','Exílio','Judá e seus governantes','A queda da cidade e a deportação encerram Reis.','Jerusalém → Babilônia');
episode('1 Crônicas',1,9,'chronicles-genealogies','As famílias e a memória de Israel','Memória de Israel','Famílias de Israel','Genealogias apresentam relações e memória; não formam um percurso físico contínuo.',undefined,'literary');
episode('1 Crônicas',10,29,'chronicles-david','Davi na perspectiva de Crônicas','Monarquia · relato paralelo','Davi e Israel','Crônicas retoma acontecimentos ligados a Samuel e Reis, com ênfases próprias; a jornada não reinicia a história como se fosse posterior.','Israel e Jerusalém');
episode('2 Crônicas',1,9,'chronicles-solomon','Salomão e o templo em Crônicas','Monarquia · relato paralelo','Salomão','Releitura do reinado de Salomão e do templo, paralela a Reis.','Jerusalém');
episode('2 Crônicas',10,36,'chronicles-judah','A história de Judá em Crônicas','Reinos divididos, exílio e retorno anunciado','Reis de Judá','O livro percorre a história de Judá e chega ao anúncio do retorno; estes acontecimentos se relacionam a Reis.','Judá e exílio');
episode('Esdras',1,6,'return-temple','O retorno e a reconstrução do templo','Retorno do exílio','Retornados e líderes da comunidade','Retorno e reconstrução no contexto persa. Ageu e Zacarias são explicitamente relacionados a esta obra em Esdras 5.1–2.','Jerusalém');
episode('Esdras',7,10,'ezra','Esdras e a vida da comunidade','Retorno do exílio','Esdras e a comunidade','A chegada de Esdras e suas ações são apresentadas nesta seção.','Babilônia → Jerusalém');
episode('Neemias',1,7,'nehemiah-walls','Neemias e os muros de Jerusalém','Comunidade sob domínio persa','Neemias e a comunidade','A missão de Neemias envolve viagem, reconstrução e oposição.','Jerusalém');
episode('Neemias',8,13,'nehemiah-community','A comunidade ouve a Lei','Comunidade sob domínio persa','Esdras, Neemias e a comunidade','Leitura da Lei, compromisso e organização da comunidade.','Jerusalém');
episode('Ester',1,10,'esther','Ester na corte persa','Comunidades judaicas sob domínio persa','Ester, Mardoqueu e a comunidade','A narrativa se passa na corte persa. A posição do livro depois de Neemias não estabelece que seus acontecimentos sejam posteriores.','Susã');
// Literary collections and prophets are contextual stops, not invented physical travel.
for(const [book,count] of CANON.slice(17,22))episode(book,1,count,`literary-${book}`,`${book}: uma parada para ouvir e refletir`,'Poesia e sabedoria','Vozes e personagens do livro','O livro reúne poesia, oração ou sabedoria. O contexto literário não deve ser transformado em uma viagem por cidade ou datado pela posição na Bíblia.',undefined,'literary');
const propheticPeriods:Record<string,string>={'Isaías':'Israel, Judá e as nações','Jeremias':'Judá e a crise do exílio','Lamentações':'Lamento pela destruição de Jerusalém','Ezequiel':'Entre os exilados','Oséias':'Reino do norte e Judá','Joel':'Contexto de Judá · datação discutida','Amós':'Israel e as nações','Obadias':'Anúncio sobre Edom · datação discutida','Miqueias':'Israel e Judá','Naum':'Anúncio sobre Nínive','Habacuque':'Judá e os caldeus','Sofonias':'Judá no tempo de Josias','Ageu':'Reconstrução do templo','Zacarias':'Retorno e reconstrução','Malaquias':'Vida da comunidade restaurada'};
for(const [book,count] of CANON.slice(22,39)){
 if(book==='Daniel'){episode(book,1,6,'daniel-court','Daniel na corte imperial','Exílio e impérios','Daniel e seus companheiros','Narrativas da vida na corte antecedem a seção de visões.','Babilônia e corte imperial');episode(book,7,12,'daniel-visions','As visões de Daniel','Visões no contexto do exílio','Daniel','As visões não formam uma viagem física. A sequência dos capítulos não é uma cronologia simples dos reinados.','Contexto imperial','vision');continue}
 if(book==='Jonas'){episode(book,1,4,'jonah','Jonas é enviado a Nínive','Missão profética','Jonas','Chamado, fuga e anúncio a Nínive. A posição entre os profetas não determina sua data por comparação com livros vizinhos.','Nínive e a viagem narrada');continue}
 episode(book,1,count,`prophetic-${book}`,`${book}: a mensagem em seu contexto`,propheticPeriods[book]??'Contexto profético','Profeta e comunidades do livro','Relacione a mensagem aos destinatários e aos cabeçalhos do próprio texto. Anúncios sobre outros povos e visões não estabelecem onde o profeta estava fisicamente.',undefined,book==='Ezequiel'?'vision':'prophetic');
}
// Gospel accounts overlap; each account retains its own sequence and emphases.
const gospelSections:Record<string,readonly [number,number,string,string][]>={
 'Mateus':[[1,2,'Nascimento e primeiros anos','Jesus e sua família'],[3,4,'Preparação e início do ministério','Jesus e João Batista'],[5,18,'Jesus ensina e atua entre o povo','Jesus e seus discípulos'],[19,25,'O caminho para Jerusalém','Jesus e seus discípulos'],[26,28,'Morte e ressurreição de Jesus','Jesus e seus discípulos']],
 'Marcos':[[1,8,'Jesus anuncia e demonstra o Reino','Jesus e seus discípulos'],[9,10,'O caminho de Jesus e o discipulado','Jesus e seus discípulos'],[11,16,'Jesus em Jerusalém: morte e ressurreição','Jesus e seus discípulos']],
 'Lucas':[[1,2,'Nascimento e primeiros anos','Jesus e sua família'],[3,9,'Preparação e ministério de Jesus','Jesus e seus discípulos'],[10,19,'A caminhada em direção a Jerusalém','Jesus e seus discípulos'],[20,24,'Morte e ressurreição de Jesus','Jesus e seus discípulos']],
 'João':[[1,1,'O Verbo e o testemunho sobre Jesus','Jesus e João Batista'],[2,11,'Sinais e encontros de Jesus','Jesus e seus discípulos'],[12,17,'Jesus em Jerusalém e a despedida','Jesus e seus discípulos'],[18,21,'Morte, ressurreição e reencontros','Jesus e seus discípulos']],
};
for(const [book,sections] of Object.entries(gospelSections))for(const [from,to,title,person] of sections)episode(book,from,to,`gospel-${book}-${from}`,title,'Ministério de Jesus · relatos paralelos',person,'O Evangelho apresenta estes episódios em sua própria sequência. Trocar de Evangelho não inicia uma nova vida de Jesus.','Galileia, Judeia e lugares do relato');
episode('Atos',1,7,'acts-jerusalem','A comunidade de Jesus em Jerusalém','Igreja e missão','Apóstolos e comunidade','O testemunho começa em Jerusalém.','Jerusalém');
episode('Atos',8,12,'acts-expansion','O testemunho alcança outras comunidades','Igreja e missão','Filipe, Pedro, Saulo e as comunidades','A narrativa acompanha pessoas e lugares diferentes; não é uma única viagem de Paulo.','Judeia, Samaria e regiões vizinhas');
episode('Atos',13,14,'acts-first-mission','Paulo e Barnabé saem em missão','Viagens missionárias','Paulo e Barnabé','Acompanhe os lugares nomeados na missão e o retorno.','Chipre e Ásia Menor');
episode('Atos',15,15,'acts-council','Uma decisão da comunidade em Jerusalém','Igreja e missão','Apóstolos e representantes das comunidades','A reunião em Jerusalém integra a história da expansão do evangelho.','Jerusalém');
episode('Atos',16,18,'acts-macedonia','As viagens alcançam Macedônia e Grécia','Viagens missionárias','Paulo e seus companheiros','O relato percorre diferentes cidades e inclui retornos e novos deslocamentos.','Ásia Menor, Macedônia e Grécia');
episode('Atos',19,20,'acts-ephesus','Éfeso e os encontros durante a viagem','Viagens missionárias','Paulo e seus companheiros','O ministério em Éfeso e os deslocamentos posteriores incluem o encontro em Mileto.','Éfeso, Grécia, Trôade e Mileto');
episode('Atos',21,26,'acts-imprisonment','Paulo em Jerusalém e Cesareia','Testemunho durante a prisão','Paulo','Chegada, prisão, defesas e audiências antecedem a viagem para Roma.','Jerusalém e Cesareia');
episode('Atos',27,27,'acts-sea','A viagem pelo mar','Caminho para Roma','Paulo e os viajantes','Navegação, tempestade e naufrágio. A linha do mapa é aproximada.','Mar Mediterrâneo');
episode('Atos',28,28,'acts-rome','A chegada a Roma','Caminho para Roma','Paulo e as comunidades','Depois de Malta, a narrativa acompanha a chegada a Roma.','Malta → Roma');
for(const [book,count] of CANON.slice(44,65))episode(book,1,count,`letter-${book}`,`${book}: uma mensagem à comunidade`,'Cartas às comunidades cristãs','Autor e destinatários da carta','O ponto no mapa identifica o contexto ou os destinatários quando conhecidos. A carta pode se relacionar a Atos, mas isso exige evidência específica; não presumimos data ou local de escrita.',undefined,'letter');
episode('Apocalipse',1,3,'revelation-churches','Uma mensagem às sete igrejas','Testemunho e esperança','João e as igrejas','João se identifica em Patmos e o livro dirige mensagens às sete igrejas.','Patmos e igrejas da Ásia','letter');
episode('Apocalipse',4,22,'revelation-visions','As visões e a esperança da nova criação','Visões e esperança','João','As visões não são trajetos físicos do leitor ou coordenadas para a Nova Jerusalém.',undefined,'vision');

export const JOURNEY_STORIES:ReadonlyArray<JourneyStory>=Object.freeze(records);
const chapterStories=new Map<string,JourneyStory>();
for(const [book,count] of CANON)for(let chapter=1;chapter<=count;chapter++){
 const matches=JOURNEY_STORIES.filter(story=>story.book===book&&chapter>=story.fromChapter&&chapter<=story.toChapter);
 if(matches.length!==1)throw new Error(`Episódio ausente ou sobreposto: ${book} ${chapter}`);
 chapterStories.set(`${book}:${chapter}`,matches[0]);
}
export function storyForChapter(book:string,chapter:number):JourneyStory{
 const story=chapterStories.get(`${book}:${chapter}`);
 if(!story)throw new Error('Capítulo fora do cânon da jornada.');
 return story;
}
/** Canon order is retained for lookup; this is not a claim about event dates. */
export const CHAPTER_STORIES=Object.freeze(CHAPTERS.map(chapter=>Object.freeze({id:chapter.id,storyId:storyForChapter(chapter.book,chapter.chapter).id})));
