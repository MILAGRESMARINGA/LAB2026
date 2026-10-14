/** LABGAME Christian formation curriculum: short outlines, not reviewed full exegesis. */
export type FormationLesson={id:string;title:string;summary:string;references:readonly string[]};
export type FormationTrack={
 id:"discipulado"|"teologia"|"vida";
 title:string;audience:string;intro:string;
 lessons:readonly FormationLesson[];
};

export const CHRISTIAN_FORMATION:readonly FormationTrack[]=[
 {
  id:"discipulado",
  title:"Primeiros passos na fé",
  audience:"Discipulado para novos convertidos",
  intro:"Conheça os fundamentos da fé cristã e os primeiros hábitos do discipulado.",
  lessons:[
   {id:"novo-nascimento",title:"Conhecer Jesus e a nova vida",summary:"Observe o diálogo de Jesus com Nicodemos e a linguagem bíblica do novo nascimento.",references:["João 3","2 Coríntios 5"]},
   {id:"salvacao-graca",title:"Salvação pela graça e pela fé",summary:"Explore o ensino sobre salvação como dom de Deus.",references:["Efésios 2","Romanos 5"]},
   {id:"ler-biblia",title:"Aprender a ler a Bíblia",summary:"Entenda o valor das Escrituras e a importância de ouvir e praticar.",references:["2 Timóteo 3","Tiago 1"]},
   {id:"orar",title:"Oração e comunhão com Deus",summary:"Conheça a oração ensinada por Jesus e o convite à perseverança.",references:["Mateus 6","Lucas 11"]},
   {id:"igreja-batismo",title:"Batismo e vida em comunidade",summary:"Examine o batismo e a vida compartilhada da igreja primitiva.",references:["Atos 2","Mateus 28"]},
   {id:"discipulo-pratica",title:"Seguir e servir",summary:"Reflita sobre o serviço ao próximo na vida de discípulo.",references:["João 13","Marcos 10"]}
  ]
 },
 {
  id:"teologia",
  title:"Teologia Sistemática",
  audience:"Fundamentos da doutrina cristã",
  intro:"Estude os temas centrais da teologia com base bíblica e revisão editorial, distinguindo interpretações quando necessário.",
  lessons:[
   {id:"bibliologia",title:"Bibliologia — As Escrituras",summary:"Inspiração, autoridade e finalidade da Palavra de Deus.",references:["2 Timóteo 3","2 Pedro 1"]},
   {id:"teologia-propria",title:"Teologia própria — Deus",summary:"O caráter, a revelação e a ação de Deus na história bíblica.",references:["Êxodo 3","Isaías 6"]},
   {id:"cristologia",title:"Cristologia — Jesus Cristo",summary:"A pessoa e a obra de Cristo na narrativa da redenção.",references:["João 1","Filipenses 2"]},
   {id:"pneumatologia",title:"Pneumatologia — Espírito Santo",summary:"O Consolador, o Pentecostes, os dons e o fruto do Espírito.",references:["João 14","Atos 2","1 Coríntios 12","Gálatas 5"]},
   {id:"antropologia-hamartiologia",title:"Humanidade, pecado e graça",summary:"Criação, queda e necessidade de reconciliação.",references:["Gênesis 1","Gênesis 3","Romanos 3"]},
   {id:"soteriologia",title:"Soteriologia — Salvação",summary:"Graça, fé, arrependimento e nova vida em Cristo.",references:["Efésios 2","Romanos 5","Tito 3"]},
   {id:"eclesiologia",title:"Eclesiologia — A Igreja",summary:"Corpo de Cristo, comunhão, serviço e missão.",references:["Atos 2","1 Coríntios 12","Efésios 4"]},
   {id:"escatologia",title:"Escatologia — Esperança cristã",summary:"Ressurreição, retorno de Cristo e esperança futura.",references:["1 Coríntios 15","1 Tessalonicenses 4","Apocalipse 21"]}
  ]
 },
 {
  id:"vida",
  title:"Vida e Caráter Cristão",
  audience:"A Palavra aplicada ao cotidiano",
  intro:"Uma trilha de reflexão sobre hábitos, caráter, relacionamentos e serviço, sem medir a fé de ninguém.",
  lessons:[
   {id:"palavra-bussola",title:"A Palavra como bússola",summary:"Aprenda a discernir e aplicar as Escrituras com responsabilidade.",references:["Salmos 119","Tiago 1"]},
   {id:"sermao-monte",title:"O Sermão do Monte",summary:"Observe o ensino de Jesus sobre atitudes e relacionamentos.",references:["Mateus 5","Mateus 6","Mateus 7"]},
   {id:"fruto-espirito",title:"Fruto do Espírito",summary:"Considere o contraste entre obras da carne e fruto do Espírito.",references:["Gálatas 5","João 15"]},
   {id:"familia-relacoes",title:"Família, comunhão e perdão",summary:"Medite sobre paciência, perdão e amor ao próximo.",references:["Colossenses 3","Efésios 4"]},
   {id:"vocacao-servico",title:"Trabalho, talentos e serviço",summary:"Responsabilidade no uso de recursos e oportunidades de servir.",references:["Mateus 25","1 Pedro 4"]},
   {id:"fe-obras",title:"Fé que se manifesta em ações",summary:"Reflita sobre a relação entre ouvir, crer e agir.",references:["Tiago 2","Miqueias 6"]}
  ]
 }
] as const;
