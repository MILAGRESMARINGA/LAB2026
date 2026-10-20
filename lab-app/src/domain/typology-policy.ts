/** Original LABGame editorial metadata; no commercial Bible/commentary text. */
export type TypologyEvidence = "explicit_nt" | "biblical_echo" | "traditional_analogy";
export type TypologyAxis = {
 id:number; title:string; evidence:TypologyEvidence; references:readonly string[]; caution:string;
};

/** Classification applies to the stated theme, never to every proposed detail. */
export const TYPOLOGY_AXES:readonly TypologyAxis[] = [
 {id:1,title:"Hermenêutica dos tipos",evidence:"explicit_nt",references:["Lucas 24:27","1 Coríntios 10:1–11","Hebreus 8–10"],caution:"A leitura cristológica respeita o contexto histórico; nem todo detalhe tem um antítipo."},
 {id:2,title:"Pares e contrastes",evidence:"traditional_analogy",references:["Levítico 14","Levítico 16","Josué 5"],caution:"Duas aves, dois bodes e pares de líderes não estabelecem automaticamente duas etapas da salvação."},
 {id:3,title:"Pão, azeite e sofrimento",evidence:"biblical_echo",references:["Isaías 53","João 6:35","João 12:24"],caution:"A imagem do grão é explícita em João; cada detalhe dos armazéns de José exige avaliação própria."},
 {id:4,title:"Páscoa e cruz",evidence:"explicit_nt",references:["Êxodo 12","Números 21:4–9","João 3:14–15","1 Coríntios 5:7"],caution:"A Páscoa e a serpente têm vínculos expressos no NT; o machado e Mara são analogias tradicionais."},
 {id:5,title:"Ressurreição e primícias",evidence:"explicit_nt",references:["Levítico 23:9–14","1 Coríntios 15:20–23"],caution:"Gênesis 8:4 informa o sétimo mês; não prova uma data pascal nem a data da ressurreição."},
 {id:6,title:"Habitação de Deus",evidence:"explicit_nt",references:["Êxodo 25:8","João 1:14","João 2:19–21","Efésios 2:19–22","Apocalipse 21:3"],caution:"Distinguir santuário histórico, corpo de Cristo, comunidade e esperança futura."},
 {id:7,title:"Arca e presença",evidence:"traditional_analogy",references:["Êxodo 25:10–22","1 Samuel 5","2 Samuel 6","1 Crônicas 15"],caution:"Madeira e ouro como duas naturezas de Cristo são interpretação tradicional, não explicação explícita do texto."},
 {id:8,title:"Purificação e santidade",evidence:"explicit_nt",references:["Levítico 16","Números 19","João 13","Hebreus 9:13–14"],caution:"Hebreus estabelece o argumento; a organização em sete provisões é uma síntese pedagógica."},
 {id:9,title:"Ofertas e reconciliação",evidence:"explicit_nt",references:["Levítico 1–7","Isaías 53","Hebreus 10:1–18"],caution:"O sacrifício de Cristo é suficiente; evitar transformar cada ingrediente em doutrina independente."},
 {id:10,title:"Cores e substâncias",evidence:"traditional_analogy",references:["Êxodo 26:1","Levítico 2","Mateus 13:33","Lucas 12:1"],caution:"As quatro cores e os quatro Evangelhos são analogia; fermento não significa sempre mal, nem mel sempre carnalidade."},
 {id:11,title:"Vestes e nova vida",evidence:"biblical_echo",references:["Gênesis 3:21","Zacarias 3","Romanos 13:14","Apocalipse 19:7–8"],caution:"Vestes do app são símbolos de progresso, não medida de justificação ou valor espiritual."},
 {id:12,title:"Lugares e memória bíblica",evidence:"traditional_analogy",references:["Gênesis 22","2 Crônicas 3:1","2 Samuel 15","Zacarias 14:4"],caution:"Não equiparar automaticamente Moriá, todo o monte do Templo e o local do Calvário."},
 {id:13,title:"Personagens e contrastes",evidence:"explicit_nt",references:["Gênesis 37:28","Romanos 5:12–21","1 Coríntios 15:45–49"],caution:"Adão/Cristo é vínculo explícito. José foi vendido por vinte peças de prata; paralelos adicionais são analogias."},
 {id:14,title:"Cristo, o Pastor",evidence:"biblical_echo",references:["Salmos 23","Ezequiel 34","João 10","Hebreus 13:20"],caution:"Não criar um cânon de sete pastores sem demonstrar cada personagem e sua referência."},
 {id:15,title:"Espírito e promessa",evidence:"explicit_nt",references:["Gênesis 1:2","Joel 2:28–32","Mateus 3:16","Atos 2:16–21"],caution:"Gênesis não menciona pomba; a imagem está no batismo. O servo em Gênesis 24 é analogia tradicional."},
 {id:16,title:"Sacerdócio e serviço",evidence:"explicit_nt",references:["Êxodo 28–29","Hebreus 7","1 Pedro 2:5–9"],caution:"Cristo é o sumo sacerdote; recompensas de liderança não conferem autoridade espiritual automática."},
];

export type ReviewedTypologyConnection = {
 id:string; title:string; evidence:Exclude<TypologyEvidence,"traditional_analogy">;
 chapters:readonly [string,string]; references:readonly string[];
};
/** Small approved registry, not an inference that all chapters in an axis connect. */
export const REVIEWED_TYPOLOGY_CONNECTIONS:readonly ReviewedTypologyConnection[] = [
 {id:"creation-word",title:"A criação e o Verbo",evidence:"biblical_echo",chapters:["1:1","43:1"],references:["Gênesis 1:1","João 1:1–3"]},
 {id:"passover-christ",title:"Cristo, nossa Páscoa",evidence:"explicit_nt",chapters:["2:12","46:5"],references:["Êxodo 12","1 Coríntios 5:7"]},
 {id:"serpent-lifted",title:"A serpente e o Filho levantado",evidence:"explicit_nt",chapters:["4:21","43:3"],references:["Números 21:4–9","João 3:14–15"]},
 {id:"adam-christ-romans",title:"Adão e Cristo",evidence:"explicit_nt",chapters:["1:3","45:5"],references:["Gênesis 3","Romanos 5:12–21"]},
 {id:"adam-christ-corinthians",title:"O último Adão",evidence:"explicit_nt",chapters:["1:2","46:15"],references:["Gênesis 2:7","1 Coríntios 15:45–49"]},
 {id:"firstfruits-resurrection",title:"Cristo, as primícias",evidence:"explicit_nt",chapters:["3:23","46:15"],references:["Levítico 23:9–14","1 Coríntios 15:20–23"]},
 {id:"spirit-pentecost",title:"A promessa e Pentecostes",evidence:"explicit_nt",chapters:["29:2","44:2"],references:["Joel 2:28–32","Atos 2:16–21"]},
 {id:"melchizedek-priest",title:"O sacerdócio segundo Melquisedeque",evidence:"explicit_nt",chapters:["1:14","58:7"],references:["Gênesis 14:18–20","Hebreus 7"]},
];

/** No same-keyword, date, color or AI-confidence heuristic may add a connection. */
export function selectTypologyConnections(chapterIds:readonly string[]):{
 connections:ReviewedTypologyConnection[]; separateChapterIds:string[];
} {
 const ids=[...new Set(chapterIds)];
 const present=new Set(ids);
 const connections=REVIEWED_TYPOLOGY_CONNECTIONS.filter(c=>c.chapters.every(id=>present.has(id)));
 const connected=new Set(connections.flatMap(c=>[...c.chapters]));
 return {connections,separateChapterIds:ids.filter(id=>!connected.has(id))};
}

export const PENTECOSTAL_TOPIC_INDEX:readonly {id:string;title:string;symbol:string;references:readonly string[]}[] = [
 {id:"spirit-baptism",title:"Batismo no Espírito Santo",symbol:"🕊️",references:["Joel 2:28–29","Atos 1:4–8","Atos 2:1–4"]},
 {id:"spiritual-gifts",title:"Dons espirituais",symbol:"🔥",references:["Romanos 12:6–8","1 Coríntios 12–14","Efésios 4:7–12"]},
 {id:"spirit-fruit",title:"Fruto do Espírito",symbol:"🍇",references:["João 15:1–8","Gálatas 5:22–23"]},
 {id:"divine-healing",title:"Cura divina",symbol:"✋",references:["Mateus 8:16–17","Tiago 5:14–16"]},
 {id:"faith",title:"Fé",symbol:"⛰️",references:["Gênesis 15:6","Marcos 11:22–24","Hebreus 11"]},
 {id:"evangelism",title:"Evangelismo pessoal",symbol:"📖",references:["Mateus 28:18–20","Atos 1:8"]},
 {id:"salvation",title:"Salvação",symbol:"✝️",references:["João 3:14–17","Romanos 3:21–26","Efésios 2:4–9"]},
 {id:"second-coming",title:"Segunda vinda de Cristo",symbol:"☀️",references:["Atos 1:11","1 Tessalonicenses 4:15–17","Apocalipse 22:12–20"]},
 {id:"spiritual-victory",title:"Vitória sobre o mal",symbol:"⚡",references:["Efésios 6:10–18","Tiago 4:7"]},
 {id:"overcoming-world",title:"Fidelidade em meio ao mundo",symbol:"🛡️",references:["João 16:33","Romanos 12:1–2","1 João 5:4–5"]},
 {id:"praise",title:"Louvor ao Senhor",symbol:"🎵",references:["Salmos 100","Salmos 150","Atos 16:25"]},
 {id:"holiness",title:"Obediência e santidade",symbol:"👣",references:["Romanos 6","Hebreus 12:14","1 Pedro 1:13–16"]},
];

export const STUDY_DOCTRINAL_POLICY = {
 tradition:"evangélica pentecostal clássica e arminiana",
 commitments:["graça preveniente","resposta humana à graça","salvação pela graça mediante a fé","perseverança e santificação","atualidade dos dons"],
 editorialRule:"Apresentar a perspectiva confessional com clareza e respeito; não alterar nem substituir o texto bíblico para adequá-lo à interpretação.",
 rewardRule:"Estudos e vídeos são bônus opcionais; a ausência de bônus não remove XP, Chama ou acesso à leitura.",
} as const;
