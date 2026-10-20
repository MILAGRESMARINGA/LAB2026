import {CANON} from "./canon";
/** Original editorial summaries. Dates describe a broad composition horizon, not certainty. */
export type BookIntroduction={book:string;author:string;date:string;theme:string;context:string;purpose:string;outline:string;features:string;newTestament:string};
// Canonical order; references are the primary basis for these concise summaries.
const summaries:ReadonlyArray<readonly [string,string,string,string]>=[
["Criação, promessa e aliança","1–11: origens; 12–36: patriarcas; 37–50: José","A narrativa acompanha a família de Abraão até o Egito.","Rm 4; Gl 3: a promessa a Abraão e a fé."],
["Libertação e presença de Deus","1–18: saída do Egito; 19–24: aliança; 25–40: tabernáculo","Israel é libertado da escravidão e chamado à aliança.","1Co 5.7: Cristo e a Páscoa; Jo 1.14: presença entre nós."],
["Santidade e aproximação de Deus","1–7: ofertas; 8–10: sacerdotes; 11–16: pureza; 17–27: santidade","As instruções se situam no acampamento de Israel junto ao Sinai.","Hb 9–10: sacrifício de Cristo e acesso a Deus."],
["Fidelidade de Deus no deserto","1–10: preparação; 11–25: peregrinação; 26–36: nova geração","Uma geração atravessa o deserto entre o Sinai e as planícies de Moabe.","1Co 10.1–13: advertências da peregrinação; Jo 3.14–15."],
["Amar a Deus e guardar a aliança","1–4: memória; 5–26: ensino; 27–34: aliança e despedida","Moisés exorta Israel antes da entrada na terra.","Mt 4.1–11: Jesus responde à tentação com Deuteronômio."],
["Promessa, terra e fidelidade","1–12: entrada e conflitos; 13–22: distribuição; 23–24: aliança","Israel atravessa o Jordão sob a liderança de Josué.","Hb 4.8–11: o descanso definitivo ultrapassa a entrada na terra."],
["Crise e necessidade de liderança fiel","1–2: panorama; 3–16: juízes; 17–21: desagregação","O livro retrata ciclos de infidelidade antes da monarquia.","Hb 11.32–34 recorda personagens do período sem aprovar todos os seus atos."],
["Lealdade, providência e resgate","1: perda; 2: encontro; 3: pedido de resgate; 4: restauração","Uma família enfrenta fome e perda no período dos juízes.","Mt 1.5 inclui Rute na genealogia de Jesus."],
["Realeza e obediência","1–7: Samuel; 8–15: Saul; 16–31: ascensão de Davi","Israel passa dos juízes à monarquia.","At 13.20–23 situa Samuel, Saul e Davi na história que conduz a Jesus."],
["Aliança davídica e responsabilidade do rei","1–10: reinado de Davi; 11–20: pecado e crises; 21–24: epílogo","O reinado de Davi reúne promessas e consequências de suas decisões.","Lc 1.32–33 retoma a promessa do trono de Davi."],
["Reis, templo e divisão do reino","1–11: Salomão; 12–16: divisão; 17–22: Elias e os reis","A monarquia se divide em Israel e Judá.","Mt 12.42 apresenta Jesus como maior que Salomão."],
["Juízo, exílio e esperança","1–8: Eliseu; 9–17: queda de Israel; 18–25: Judá e exílio","Assíria e Babilônia dominam o cenário dos dois reinos.","Lc 4.27 menciona Naamã e Eliseu ao tratar da graça de Deus."],
["Memória de Israel e culto","1–9: genealogias; 10–29: Davi e preparação do templo","O passado é recontado com atenção ao culto e à linhagem de Davi.","Mt 1.1 e Lc 3 situam Jesus na história das gerações de Israel."],
["Templo, reis de Judá e retorno","1–9: Salomão; 10–36: reis de Judá, exílio e decreto de retorno","A história destaca a resposta dos reis e do povo a Deus.","At 7.47–50 relembra Salomão e os limites de um templo construído por mãos humanas."],
["Retorno e reconstrução","1–6: retorno e templo; 7–10: Esdras e renovação","Comunidades judaicas retornam sob o domínio persa.","Jo 4.21–24 amplia a reflexão sobre o lugar e a natureza da adoração."],
["Reconstrução e renovação comunitária","1–7: muralhas; 8–10: Palavra e aliança; 11–13: reorganização","Jerusalém é reconstruída no período persa.","At 2.42–47 oferece um paralelo de vida comunitária, sem ser cumprimento direto."],
["Preservação em meio à ameaça","1–2: Ester na corte; 3–7: ameaça e intervenção; 8–10: livramento","Judeus da diáspora vivem sob o governo persa.","O NT não cita Ester diretamente; preserve seu contexto histórico e literário."],
["Sofrimento, sabedoria e limites humanos","1–2: provação; 3–37: debates; 38–42: resposta divina","Um justo sofre; os discursos desafiam explicações simplistas da dor.","Tg 5.11 recorda a perseverança de Jó e a compaixão do Senhor."],
["Oração, louvor e confiança","1–41; 42–72; 73–89; 90–106; 107–150: cinco livros de cânticos","Uma coleção de orações reúne diferentes situações e épocas de Israel.","Lc 24.44; At 2.25–36: salmos relidos à luz de Cristo."],
["Sabedoria para a vida cotidiana","1–9: convites à sabedoria; 10–29: provérbios; 30–31: coleções finais","Máximas sapienciais orientam escolhas responsáveis, não promessas mecânicas.","Tg 1.5 e 3.13–18 convidam à sabedoria que vem de Deus."],
["Sentido da vida e temor de Deus","1–2: busca; 3–11: observações; 12: conclusão","A voz de Qohelet examina o trabalho, o tempo e a mortalidade.","Rm 8.20–25 pode acompanhar a reflexão sobre transitoriedade e esperança."],
["Amor e desejo na poesia","1–8: encontros, separações e celebração do amor","Poemas celebram o amor entre os amantes com imagens da natureza.","Ef 5.25–32 oferece uma analogia cristã do amor; não substitui o sentido poético do livro."],
["Santidade, juízo e restauração","1–39: Judá e nações; 40–55: consolo; 56–66: restauração","O livro reúne oráculos ligados a crises de Judá e à esperança de restauração.","Lc 4.16–21; At 8.32–35: anúncio de Jesus e o Servo."],
["Aliança rompida e esperança renovada","1–25: advertências; 26–45: profeta e crises; 46–52: nações e queda","Judá enfrenta a ameaça babilônica e a queda de Jerusalém.","Hb 8.8–12 cita a promessa da nova aliança de Jr 31."],
["Lamento e esperança em meio às ruínas","1–5: cinco poemas de lamento","A destruição de Jerusalém é chorada em oração e poesia.","Não há citação direta inequívoca no NT; o lamento pode ser lido com Rm 12.15."],
["Glória, responsabilidade e renovação","1–24: juízo; 25–32: nações; 33–48: restauração","Entre os exilados na Babilônia, Ezequiel anuncia juízo e nova vida.","Jo 10 e Ap 21–22 retomam imagens de pastoreio e renovação."],
["Fidelidade sob impérios e soberania de Deus","1–6: narrativas; 7–12: visões","Judeus vivem sob poderes estrangeiros; as visões oferecem esperança em meio à oposição.","Mc 14.62 retoma o Filho do Homem de Dn 7."],
["Amor fiel e chamado ao arrependimento","1–3: sinal familiar; 4–14: denúncia e retorno","O ministério de Oséias se dirige sobretudo ao reino do Norte.","Mt 2.15 relê Os 11.1 em relação a Jesus; Rm 9.25–26 cita Oséias."],
["Dia do Senhor e derramamento do Espírito","1: devastação; 2: retorno e promessa; 3: juízo","Uma calamidade motiva o chamado coletivo ao arrependimento.","At 2.16–21 cita a promessa do Espírito de Jl 2.28–32."],
["Justiça e culto verdadeiro","1–2: nações; 3–6: denúncias; 7–9: visões e esperança","Amós denuncia injustiça no reino do Norte em tempo de prosperidade desigual.","At 15.15–18 cita a restauração da casa de Davi em Am 9."],
["Orgulho, violência e justiça","1–21: juízo de Edom e restauração","A hostilidade de Edom contra Judá é confrontada.","Não há citação direta inequívoca no NT; evite inventar um cumprimento específico."],
["Misericórdia além das fronteiras","1–2: fuga e oração; 3–4: Nínive e a resposta de Jonas","Um profeta resiste à misericórdia de Deus para com uma cidade estrangeira.","Mt 12.39–41: Jesus menciona o sinal de Jonas."],
["Justiça, misericórdia e esperança messiânica","1–3: juízo; 4–5: esperança; 6–7: aliança e misericórdia","Israel e Judá são confrontados por injustiça e corrupção.","Mt 2.5–6 cita Mq 5.2 em relação a Belém."],
["Queda do poder opressor","1: caráter de Deus; 2–3: queda de Nínive","O domínio assírio é confrontado por sua violência.","Rm 12.19 ajuda a distinguir a justiça de Deus da vingança pessoal."],
["Fé em meio à injustiça","1–2: perguntas e respostas; 3: oração","O profeta questiona a violência e o uso de uma potência invasora.","Rm 1.17; Gl 3.11; Hb 10.38 retomam Hc 2.4."],
["Dia do Senhor e restauração do remanescente","1: juízo; 2: retorno e nações; 3: restauração","O anúncio se situa em Judá durante o reinado de Josias.","O NT não cita o livro diretamente; a esperança de restauração pode acompanhar Ap 21."],
["Prioridades e reconstrução do templo","1: chamado à reconstrução; 2: encorajamento e promessa","Após o retorno do exílio, o templo continua incompleto.","Hb 12.26 cita Ag 2.6 ao falar do abalo final."],
["Restauração e esperança do rei","1–6: visões; 7–8: justiça e jejum; 9–14: rei e futuro","A comunidade retornada recebe encorajamento durante a reconstrução.","Mt 21.4–5 cita Zc 9.9; Jo 19.37 retoma Zc 12.10."],
["Fidelidade à aliança e culto sincero","1–2: culto e relações; 3–4: purificação e dia do Senhor","A comunidade pós-exílica é chamada à fidelidade.","Mc 1.2 e Mt 11.10 retomam a promessa do mensageiro."],
["Jesus, Messias e mestre do reino","1–4: origens; 5–25: ensino e ministério; 26–28: paixão e ressurreição","A narrativa dialoga intensamente com as Escrituras de Israel.","O próprio Evangelho apresenta a vida de Jesus à luz das promessas de Israel."],
["Jesus, Servo e Filho de Deus","1–8: ministério; 8–10: caminho; 11–16: Jerusalém e ressurreição","O anúncio enfatiza a ação de Jesus e o caminho do discipulado.","Mc 10.45 relaciona a missão de Jesus ao serviço e ao resgate."],
["Salvação e boas-novas para todos","1–2: nascimento; 3–9: ministério; 9–19: caminho; 19–24: Jerusalém","O Evangelho e Atos formam uma narrativa em dois volumes.","Lc 24 liga a morte e ressurreição de Jesus às Escrituras e à missão."],
["Vida pela fé em Jesus, o Filho de Deus","1: prólogo; 2–12: sinais; 13–17: despedida; 18–21: paixão e ressurreição","Sinais e discursos revelam quem é Jesus.","Jo 20.30–31 explicita o propósito de conduzir à fé e à vida."],
["Espírito Santo e testemunho de Jesus","1–7: Jerusalém; 8–12: expansão; 13–28: missão até Roma","A comunidade cristã cresce do ambiente judaico ao mundo mediterrâneo.","At 1.8 orienta o movimento do livro e a missão da Igreja."],
["Justiça de Deus e vida pela fé","1–4: pecado e fé; 5–8: vida nova; 9–11: Israel; 12–16: prática","Paulo escreve a cristãos em Roma antes de visitá-los.","Rm 3.21–26 apresenta a redenção em Cristo; 12–15 desenvolve suas consequências."],
["Santidade, unidade e amor na comunidade","1–4: divisões; 5–11: vida comunitária; 12–14: dons; 15–16: ressurreição","Uma igreja em Corinto enfrenta conflitos e dúvidas práticas.","1Co 15 preserva o anúncio da morte e ressurreição de Cristo."],
["Ministério, fraqueza e reconciliação","1–7: ministério; 8–9: generosidade; 10–13: defesa apostólica","Paulo enfrenta tensões com parte da comunidade de Corinto.","2Co 5.17–21 apresenta a nova criação e o ministério da reconciliação."],
["Liberdade em Cristo e vida no Espírito","1–2: Evangelho; 3–4: promessa e fé; 5–6: liberdade responsável","Comunidades da Galácia discutem circuncisão e pertencimento ao povo de Deus.","Gl 5.13–26 une liberdade, serviço e fruto do Espírito."],
["Unidade e nova humanidade em Cristo","1–3: identidade em Cristo; 4–6: vida e relações","A carta apresenta a unidade de judeus e gentios em Cristo.","Ef 2.11–22 descreve reconciliação e um só povo em Cristo."],
["Alegria e humildade em Cristo","1: Evangelho; 2: humildade; 3: alvo; 4: contentamento","Paulo escreve preso a uma igreja parceira na missão.","Fp 2.5–11 apresenta a humilhação e exaltação de Cristo."],
["Suficiência e supremacia de Cristo","1–2: identidade de Cristo; 3–4: vida nova","A igreja é exortada a permanecer em Cristo diante de ensinos rivais.","Cl 1.15–20 celebra a primazia de Cristo e a reconciliação."],
["Esperança e santidade na espera de Cristo","1–3: gratidão e missão; 4–5: santidade e esperança","Uma comunidade recente vive oposição e dúvidas sobre os que morreram.","1Ts 4.13–18 oferece consolo na esperança da ressurreição."],
["Perseverança e responsabilidade","1: consolo; 2: dia do Senhor; 3: vida responsável","A comunidade recebe orientação contra alarmismo e desordem.","2Ts 2–3 une esperança futura à fidelidade presente."],
["Ensino fiel e cuidado da comunidade","1: ensino; 2–3: culto e liderança; 4–6: cuidado e prática","Timóteo recebe orientações sobre a organização da igreja.","1Tm 2.5–6 proclama Cristo como mediador."],
["Perseverança na Palavra e no serviço","1–2: fidelidade; 3–4: Escritura e missão","Uma despedida apostólica encoraja Timóteo a perseverar.","2Tm 3.14–17 destaca o papel das Escrituras na formação cristã."],
["Boa doutrina e boas obras","1: liderança; 2: ensino; 3: graça e conduta","Tito recebe instruções para as comunidades em Creta.","Tt 2.11–14 relaciona a graça à vida piedosa."],
["Reconciliação e fraternidade em Cristo","1–25: apelo em favor de Onésimo","Paulo faz um pedido pessoal dentro da realidade escravista romana.","Fm 15–17 pede que Onésimo seja acolhido como irmão amado."],
["Cristo, sumo sacerdote e mediador","1–4: superioridade do Filho; 5–10: sacerdócio; 11–13: perseverança","Uma comunidade é encorajada a não abandonar sua confissão.","Hb 8–10 interpreta tabernáculo e sacrifícios à luz de Cristo."],
["Fé vivida em obras e sabedoria","1–2: provações e prática; 3–5: língua, justiça e oração","A carta exorta comunidades a uma fé coerente com suas ações.","Tg 2.14–26 denuncia a fé meramente verbal, sem amor atuante."],
["Esperança e santidade em meio ao sofrimento","1–2: identidade; 3–4: testemunho; 5: cuidado pastoral","Cristãos na Ásia Menor são exortados a viver fielmente sob pressão.","1Pe 2.21–25 apresenta o sofrimento de Cristo como fundamento e exemplo."],
["Crescimento e fidelidade à promessa","1: maturidade; 2: falsos mestres; 3: esperança","A carta combate ensinos que distorcem a liberdade e a esperança cristãs.","2Pe 3.13 aponta para novos céus e nova terra."],
["Verdade, amor e vida em Cristo","1–2: luz; 3–4: amor e discernimento; 5: fé e vida","Comunidades enfrentam divisões e negação da encarnação.","1Jo 4.1–3 une discernimento à confissão de Jesus Cristo vindo em carne."],
["Amor na verdade e discernimento","1–13: mandamento do amor e alerta doutrinário","Uma breve carta trata de hospitalidade e fidelidade ao ensino de Cristo.","2Jo 6–9 reúne amor, obediência e permanência no ensino."],
["Hospitalidade e serviço fiel","1–15: Gaio, Diótrefes e Demétrio","A recepção de cooperadores cristãos é colocada em contraste com o autoritarismo.","3Jo 5–8 incentiva cooperação com os que servem à verdade."],
["Perseverar na fé e exercer misericórdia","1–4: chamado; 5–16: advertências; 17–25: perseverança","A carta adverte contra distorções morais e doutrinárias.","Jd 20–25 une perseverança, misericórdia e confiança em Deus."],
["Vitória do Cordeiro e nova criação","1–3: igrejas; 4–18: visões; 19–22: vitória e nova criação","João escreve a sete igrejas da Ásia em contexto de pressão imperial.","Ap 21–22 conclui a narrativa bíblica com Deus habitando com seu povo."]
];
const authorFor=(i:number):string=>{
 if(i<5)return "Tradicionalmente atribuído a Moisés; a composição e a edição final são debatidas.";
 if(i===5)return "Tradicionalmente associado a Josué; a redação final não é identificada.";
 if([6,7,8,9].includes(i))return "Autor não identificado; tradições judaicas associam parte desses relatos a Samuel e a registros proféticos.";
 if([10,11].includes(i))return "Autor não identificado; o texto menciona registros anteriores dos reis.";
 if([12,13,14].includes(i))return "Autor não identificado; tradição associa a coleção a Esdras.";
 if(i===15)return "Memórias de Neemias e materiais narrativos; edição final não identificada.";
 if([16,17,24].includes(i))return "Autor não identificado; atribuições tradicionais não são conclusivas.";
 if(i===18)return "Diversos salmistas; os títulos incluem Davi, Asafe e os filhos de Corá, entre outros.";
 if(i===19)return "Coleções associadas a Salomão e a outros sábios, incluindo Agur e Lemuel.";
 if(i===20)return "Qohelet (o Pregador); tradicionalmente associado a Salomão, com autoria debatida.";
 if(i===21)return "Associado a Salomão no título; autoria e organização são debatidas.";
 if(i>=22&&i<=38)return `Associado ao profeta ${CANON[i][0]}; a formação e a edição da coleção podem envolver outros transmissores.`;
 if(i<=42)return `Tradicionalmente atribuído a ${CANON[i][0]}; o texto não identifica diretamente o autor pelo nome.`;
 if(i===43)return "Tradicionalmente atribuído a Lucas, também associado ao terceiro Evangelho.";
 if(i>=44&&i<=56)return "Paulo é nomeado no texto; autoria de algumas cartas pastorais e do cativeiro é debatida na pesquisa.";
 if(i===57)return "Autor não identificado; a antiga atribuição a Paulo não é afirmada pelo próprio texto.";
 if(i===58)return "Tiago é nomeado; tradicionalmente identificado como irmão do Senhor.";
 if(i===59||i===60)return "Pedro é nomeado; autoria e data, especialmente de 2 Pedro, são debatidas.";
 if(i<=63)return "Tradição joanina; 2 e 3 João se apresentam pela designação «o presbítero».";
 if(i===64)return "Judas, apresentado como servo de Jesus Cristo e irmão de Tiago.";
 return "João, identificado no texto; sua identificação com o apóstolo é tradicional e debatida.";
};
const dateFor=(i:number):string=>{
 if(i<5)return "Data da composição final debatida; tradição mosaica e hipóteses de formação ao longo do primeiro milênio a.C.";
 if(i<=16)return "Primeiro milênio a.C.; data e etapas da redação variam por livro e são debatidas.";
 if(i<=21)return "Textos e coleções de épocas diversas; data da forma final não estabelecida com certeza.";
 if(i===31)return "Data debatida; as propostas variam entre os períodos assírio e persa.";
 if(i===36||i===37)return "Núcleo situado por Ag 1.1 e Zc 1.1 no fim do século VI a.C.; edição final debatida.";
 if(i<=38)return "Contextos monárquicos, exílicos ou pós-exílicos, conforme os oráculos; data final debatida.";
 if(i>=44&&i<=51)return "Em geral situada no século I d.C.; cartas paulinas centrais por volta das décadas de 50–60.";
 if(i===65)return "Frequentemente situada no fim do século I d.C.; há propostas anteriores.";
 return "Século I d.C. em muitas propostas; data exata e, em alguns livros, data posterior são debatidas.";
};
export const BOOK_INTRODUCTIONS:ReadonlyArray<BookIntroduction>=CANON.map(([book],i)=>{
 const [theme,outline,context,newTestament]=summaries[i];
 return {book,author:authorFor(i),date:dateFor(i),theme,context,purpose:`Convidar à leitura atenta de ${book}, acompanhando o tema: ${theme.toLowerCase()}.`,outline,features:i<39?"Leia narrativas, poesia e oráculos segundo seu gênero; diferencie descrição de acontecimentos e mandamentos.":"Observe destinatários, gênero e contexto; leia os versículos dentro do argumento e da narrativa.",newTestament};
});
export function getBookIntroduction(book:string):BookIntroduction|undefined{return BOOK_INTRODUCTIONS.find(item=>item.book===book)}
