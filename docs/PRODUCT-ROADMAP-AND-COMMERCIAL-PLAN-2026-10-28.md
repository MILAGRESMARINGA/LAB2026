# LABGAME — roadmap de produto, produção e viabilidade comercial

**Atualizado em 28/10/2026 (Brasil)**  
**Decisão de escopo:** lançar primeiro uma beta controlada em português do
produto que já entrega valor: Bíblia, Jornada anual V1, conta e GCs privados.
V2, IA, notificações e Strong público não fazem parte do P0.

## Leitura executiva

O LABGAME não deve competir como mais um leitor de Bíblia gratuito. YouVersion
já tem escala global, leitura, planos, comunidade e acesso gratuito; o
BibleProject também mantém seu conteúdo gratuito. A diferenciação defensável é
**ritmo anual verificável + experiência de GC brasileiro + liderança local +
formação guiada**, e não a simples disponibilidade do texto bíblico.

O mercado inicial é suficientemente grande para piloto, mas não é uma prova de
receita: o Censo 2022 apontou 47,4 milhões de evangélicos com 10 anos ou mais
(26,9% do país). A entrada comercial deve começar por igrejas e GCs que tragam
grupos reais, não por aquisição ampla de consumidores.

## P0 — beta de lançamento: obrigatório

### Escopo que será lançado

- Onboarding em `pt-BR`, Bíblia Almeida 1911, busca, leitura por capítulo e
  favoritos.
- Jornada V1 de 365 dias, registro transacional de capítulos, XP, sequência e
  reinício seguro.
- Conta, login, recuperação de senha, perfil e GCs privados por convite.
- PWA instalável, sem prometer leitura offline ou notificação que não tenha sido
  homologada.

### Itens explicitamente fora do P0

- Jornada V2 e qualquer alteração de regras para usuários existentes.
- Assinatura, cobrança, IA generativa, anúncios e compra dentro do app.
- Disparo de e-mail/push em produção.
- Exposição pública do Strong: as 18.085 glosas `pt-BR` estão no banco como
  `machine`, e as releases continuam em `draft` para revisão editorial.
- Rank público, marketplace de conteúdo e métricas espirituais.

### Gates técnicos de aceite

| Gate | Evidência mínima para liberar beta | Situação observada |
| --- | --- | --- |
| Domínio e Auth | URLs de Site/Redirect no Supabase, cadastro, confirmação, login e reset em domínio final | Pendente de homologação real |
| Duas contas | Dois usuários reais de teste validam isolamento RLS, GC, convite, leitura e XP | Pendente |
| Mobile | Chrome Android e Safari iOS: cadastro, leitura, retorno de sessão e instalação PWA | Pendente |
| Dados e recuperação | Backup off-site, restauração testada, responsável e runbook de incidente | Restauração local existe; cópia off-site e exercício final pendentes |
| Segurança | Revisão de RLS/ACL, proteção de senha vazada quando disponível, segredo fora do frontend | ACL já endurecida; smoke autenticado e proteção de senha pendentes |
| Privacidade | Política de privacidade, termos, base LGPD para dado religioso, retenção, exclusão e exportação efetivas | Pendente |
| Direitos editoriais | Inventário de licença e atribuição do texto, vídeos e léxico; revisão dos itens publicados | Pendente para a camada Strong |
| Operação | Monitoramento de erros e disponibilidade, canal de suporte, critério de rollback | Pendente |
| Produto | Cinco GCs pilotos convidados, roteiro de onboarding e pesquisa de ativação | Pendente |

**Regra de saída do P0:** lançar para no máximo 5 igrejas/GCs e 200 leitores
convidados somente depois de todos os gates acima terem evidência registrada.
Nenhuma pendência é compensada por CI verde.

## Roadmap reorganizado

### Fase 0 — fechar o P0 (2–4 semanas após definir responsáveis)

1. Configurar domínio final, Supabase Auth, templates e SMTP; testar links,
   OTP, expiração e recuperação em dois aparelhos.
2. Executar QA real com duas contas por fluxo crítico e registrar evidência.
3. Concluir documentos de privacidade/termos, retenção e suporte.
4. Habilitar observabilidade mínima (erros, uptime, trilha de deploy e
   rollback), sem coletar conteúdo de leitura desnecessário.
5. Fazer auditoria de fonte/licença e preparar a fila editorial para o Strong.
6. Convidar cinco GCs com um líder responsável e estabelecer canal de suporte.

**Métrica de passagem:** 70% dos convidados criam conta; 50% fazem a primeira
leitura em 72 horas; nenhuma violação de isolamento de dados; nenhum fluxo P0
bloqueado sem resposta operacional.

### Fase 1 — provar aderência e receita (30–90 dias)

- Painel de líder **somente com dados agregados e consentidos**: ativação do
  grupo, leitores ativos na semana e convite revogável.
- Entrevistas semanais com líderes e leitores; corrigir onboarding antes de
  adicionar gamificação nova.
- Instrumentação de funil com retenção D1/D7/D30 e conclusão de primeira etapa,
  sem rastrear o conteúdo íntimo de notas ou orações.
- Piloto comercial B2B2C: igreja/GC paga pela gestão e formação; o leitor
  continua com um núcleo gratuito útil.
- Definir checkout, NFS-e, cancelamento e atendimento **somente antes de cobrar**.

**Métrica de passagem:** D7 >= 35%, D30 >= 20%, pelo menos 5 organizações
pagantes ou 15 com carta de intenção, e churn mensal mensurável.

### Fase 2 — aprofundamento confiável (3–6 meses)

- Publicar Strong somente após revisão editorial em lote, atribuição e tela que
  informe claramente a origem/tradução em revisão quando aplicável.
- Notificações opt-in após a infraestrutura de envio, opt-out e monitoramento.
- Notas privadas, referências cruzadas e conteúdos formativos revisados por
  especialistas.
- Jornada V2 mediante migração reversível, coortes pequenas e nenhuma mudança
  silenciosa para leitores V1.

### Fase 3 — escala (6–12 meses)

- Planos por igreja, gestão de líderes, temporadas e relatórios agregados.
- Conteúdo licenciado/revisado, acessibilidade contínua e auditoria independente.
- Oferta nacional somente após repetição de retenção, suporte sustentável e
  unidade econômica positiva.

## Modelo comercial recomendado

### Posicionamento

**“A jornada bíblica que transforma intenção em constância — para o leitor e
para o seu GC.”**

Não vender “mais uma Bíblia”, nem prometer crescimento espiritual mensurável.
Cobrar pela organização, acompanhamento consensual, formação curada e operação
do grupo; preservar leitura e recursos essenciais gratuitos.

### Ofertas após a beta

| Oferta | Público | Preço-teste | O que compra |
| --- | --- | ---: | --- |
| Leitor gratuito | Pessoa individual | R$ 0 | Bíblia, Jornada, perfil e GC básico |
| Aprofundamento | Pessoa individual | R$ 9,90/mês | Estudos revisados, caderno ampliado e recursos de formação |
| Igreja/GC Piloto | Igreja ou rede de GCs | R$ 299–399/mês | Gestão de líderes, coortes, dados agregados, suporte e formação |
| Igreja Crescimento | Organização com operação comprovada | R$ 499+/mês | Múltiplos líderes, temporadas, exportações e suporte prioritário |

O preço individual é uma **hipótese de teste**, ancorada na faixa pública de
R$ 4,99–9,90/mês vista no concorrente brasileiro Concordância; não é uma ordem
de cobrança agora. Não lançar planos até checkout, cancelamento, nota fiscal e
suporte estarem completos.

## Valor, valuation e payback

Esta seção é uma estimativa de planejamento — não é laudo, captação garantida
nem recomendação de investimento. Sem receita, retenção ou contratos, valuation
é negociação, não fato.

### Faixa de valuation pre-money

| Situação verificável | Faixa indicativa | Por quê |
| --- | ---: | --- |
| Código e ativos, pré-receita, sem pilotos ativos | **R$ 0,8–1,5 mi** | MVP amplo, dados e fluxo já construídos, porém risco de lançamento e direitos/editorial ainda alto |
| Beta com 5 igrejas pagantes, D30 comprovado e suporte operando | **R$ 1,8–3,0 mi** | Começa a existir prova de distribuição e retenção, não apenas software |
| R$ 10 mil de MRR por 4–6 meses, churn e CAC medidos | **R$ 3–5 mi** | Baseado em receita recorrente demonstrável e previsibilidade comercial |

A faixa inicial pressupõe que direitos, privacidade e operação sejam fechados.
Sem esses gates, o valor econômico é próximo ao custo de reconstrução, e não a
uma rodada investível.

### Cenários de payback do investimento P0 + piloto

Premissa de investimento de implantação: **R$ 50 mil** (faixa plausível
R$ 42–70 mil), abrangendo hardening, QA em aparelhos, conteúdo/privacidade,
operação e ativação comercial. A margem de contribuição abaixo já desconta
taxas de pagamento, infraestrutura, suporte básico e uma reserva de conteúdo;
não inclui salário dos sócios nem CAC extraordinário.

| Cenário | Base mensal | Receita mensal | Margem de contribuição | Payback estimado sobre R$ 50 mil |
| --- | --- | ---: | ---: | ---: |
| Conservador | 8 igrejas × R$ 299 + 120 leitores × R$ 9,90 | R$ 3.580 | ~R$ 2.500 | ~20 meses |
| Base | 20 igrejas × R$ 399 + 500 leitores × R$ 9,90 | R$ 12.930 | ~R$ 8.650 | ~6 meses; planejar 8–10 com CAC |
| Escala inicial | 50 igrejas × R$ 499 + 1.500 leitores × R$ 14,90 | R$ 47.300 | ~R$ 30.000 | ~2 meses; somente após provar aquisição e suporte |

**Decisão financeira recomendada:** usar o cenário conservador para caixa. Não
contar payback antes de haver organizações pagantes e retenção D30. Se a beta
não converter pelo menos 5 organizações em 90 dias, interromper a construção de
novos módulos e revisar problema, público e preço.

## Referências de mercado

- Censo 2022/IBGE: 47,4 milhões de evangélicos (26,9% da população com 10+).
  <https://agenciagov.ebc.com.br/noticias/202506/censo-2022-catolicos-seguem-em-queda-evangelicos-e-sem-religiao-crescem-no-pais>
- YouVersion comunica aplicativo gratuito, 710M+ instalações, milhares de
  idiomas e recursos de leitura, hábito e comunidade.
  <https://www.youversion.com/pt/bible-app>
- BibleProject informa que seus recursos são gratuitos e oferece português
  brasileiro.
  <https://bibleproject.com/pt-br/languages/>
- Concorrente brasileiro Concordância anuncia R$ 4,99/mês Essencial e
  R$ 9,90/mês Premium em lançamento.
  <https://www.concordancia.com.br/site/precos>
