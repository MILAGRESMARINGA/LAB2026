# LABGAME — Cadastro, perfis e regras de pontuação

Atualização: 11/10/2026. Repositório `MILAGRESMARINGA/LAB2026`, branch `lab-rebuild-2026`.

## Endereço de teste estável

**https://labgame-biblia.vercel.app**

Alias Vercel vinculado ao build READY `dpl_CWvVxqJc3WkHKfKqKpoQven46P6i` (commit `0fa39967ccaefa20f73b0c0502a98612b2b7ec99`). O CI do build executou `npm test && npm run build`: **73 testes aprovados em 15 arquivos**.

## Cadastro e login

1. Abrir LABGAME e tocar em **Perfil** ou **GCs**. As duas abas exibem imediatamente o formulário de acesso se ainda não houver sessão.
2. Escolher **Criar conta**, informar nome (2–60 caracteres), e-mail válido, senha com no mínimo 8 caracteres, uma letra e um número, e confirmar a senha.
3. Informar modalidade inicial individual ou GC (ambas podem ser utilizadas posteriormente).
4. Se o Supabase exigir confirmação, o app orienta verificar o e-mail e permite reenviar o convite; a pessoa só entra na conta depois de confirmar.
5. Ao autenticar, o Supabase cria/recupera a sessão; a primeira sincronização cria a ficha LABGAME com o nome cadastrado.
6. O perfil disponibiliza **Esqueci minha senha**; o link exige uma origem autorizada em Supabase Auth.

### Configuração indispensável no Supabase

Em **Authentication → URL Configuration**, conferir:
- **Site URL:** `https://labgame-biblia.vercel.app`
- **Redirect URLs:** adicionar `https://labgame-biblia.vercel.app/**`.
- Enquanto forem utilizadas URLs de preview, permiti-las explicitamente apenas para testes com acesso controlado. Preferir o endereço fixo.

Verificar em **Authentication → Providers → Email** se o cadastro por e-mail está habilitado e se é exigida confirmação. Conferir a entrega de e-mail com o provedor configurado; o SMTP padrão do Supabase possui limitações de envio e pode não servir para usuários reais. **Essas configurações não foram alteradas automaticamente** e precisam ser confirmadas pelo responsável no painel.

## Pontuação individual

| Ação | Fórmula | Restrições |
| --- | --- | --- |
| Capítulo confirmado | **10 XP × capítulos confirmados** | Somente capítulo da etapa e dia correntes; sem duplicação |
| Panorama confirmado | **5 XP × panoramas únicos confirmados** | Uma bonificação por panorama, declarada após sessão mínima; não conclui leitura |
| XP total | **XP leitura + XP vídeos** | Acumulado entre tentativas; auditável por transações |
| Constância atual | **Dias completos na tentativa ativa** | Se perdeu o dia, volta à etapa 1 |
| Recorde | **Maior sequência de etapas completas** | Não diminui após perder a sequência |

`public.lab_game_scorecard()` devolve `reading_xp`, `video_xp`, `total_xp`, `recorded_xp` e `balanced` (comparação entre pontos do histórico e valor materializado), além dos capítulos, panoramas, constância e recorde.

### Ranking individual de um GC

Ordenação executada no servidor:
1. **Recorde de dias consecutivos** (decrescente);
2. **Dias completos acumulados** (decrescente);
3. **XP total acumulado** (decrescente);
4. **Nome exibido** (crescente; critério estável de desempate).

Somente participantes autenticados do GC podem consultar o ranking e apenas os membros que aceitaram aparecer nele são listados. O consentimento individual é desativado por padrão.

## Perfil do GC e Liga dos GCs

O botão **PERFIL DO GC** abre:
- nome e identificação do grupo;
- número de integrantes;
- participantes que deram consentimento ao ranking;
- dias de leitura completos por participantes com consentimento nos últimos sete dias;
- percentual de assiduidade semanal;
- classificação individual privada do próprio grupo.

**Fórmula da liga coletiva:**

```
assiduidade_% =
    (dias completos de participantes que deram consentimento nos últimos 7 dias)
    / (7 × quantidade de participantes com consentimento)
    × 100
```

Exemplo: um grupo com quatro integrantes, três inscritos no ranking e sete dias completos contabilizados obtém `7 / (7×3) ×100 = 33,3%`. O participante que não autorizou participação **não** diminui o percentual dos demais.

A Liga pública entre GCs requer inscrição voluntária do líder e pelo menos três membros com consentimento, e só pode ser consultada por integrantes de GCs inscritos. O acesso ao perfil de um GC particular requer participação nesse grupo. Vídeos e XP extra não interferem no percentual.

## Testes efetivamente executados

- Build da Vercel: **73/73 testes automatizados aprovados**, `READY`.
- Configuração Vercel: URL do Supabase confirmada; chave publishable conferida contra projeto LABGAME; nenhum segredo administrativo exposto no frontend.
- SQL: existência e proteção das funções `lab_game_scorecard()` e `lab_game_group_summary(uuid)`; recusa de acesso anônimo; matrícula de líder e criação de convite testadas em transações temporárias anteriores.
- Conteúdo: 66 livros, 1.189 capítulos, 31.101 versículos, 71 recursos BibleProject.

### Homologação ainda pendente

**Não** houve teste real de entrega de e-mail ou login com novas credenciais na interface. Tentativas de testes completos de transações simuladas nessa rodada foram bloqueadas pelas permissões da ferramenta. Uma conta do próprio participante e uma segunda conta de GC devem verificar: cadastro, confirmação de e-mail, login, criação de GC, convite, aprovação para ranking, abertura dos dois perfis, leitura de Gênesis 1 e XP após confirmação.

A validação do emailRedirectTo depende do ajuste das URLs no Supabase Authentication.
