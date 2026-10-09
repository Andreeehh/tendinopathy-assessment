# Plano de desenvolvimento — Plataforma para Tendinopatias (v2)

Base: escopo v2 (Daniel + André) e estado atual do código (`main`).
Princípio: **nenhuma IA generativa no MVP**. Toda decisão e organização de rotina vem de um **motor de regras pré-cadastradas**, validado pelos responsáveis técnicos.

## 1. Aderência: o que já existe × o que falta

| Escopo v2 | Estado atual | Lacuna |
|---|---|---|
| Seleção da região dolorosa (§4.3) | Mapa SVG anterior/posterior com estruturas (ombro, cotovelo, joelho, glúteo, tornozelo) e posições face/lado | Alinhar estruturas aos 5 protocolos (manguito rotador, epicondilalgia lateral, glútea, patelar, Aquiles) |
| Avaliação guiada por vídeo + dor (§7) | Exercícios `evaluation` por estrutura, player YouTube, escala 0–10 | Baterias de testes por protocolo, repetições/tempo, critérios de positividade |
| Escala de dor com descritores (§6) | Escala numérica 0–10 sem descritores | Descritores verbais; escala de esforço separada (alvo 7/10) |
| Triagem de segurança (§5) | Dor 7–10 bloqueia recomendação | Anamnese completa e flags de encaminhamento |
| Biblioteca de exercícios (§14) | CRUD com tipo, estrutura/posições, vídeo | Fase, séries, reps/tempo, cadência, descanso, esforço, equipamentos, progressão/regressão, limites de dor |
| 4 fases + rotina semanal (§8, §10) | Não existe | Entidades de protocolo/fase/rotina |
| Registro de sessão e dia seguinte (§6, §19) | Não existe | Sessões, dor durante, dor no dia seguinte, adesão |
| Reavaliação a cada 5 semanas + motor (§11, §12) | Regras apenas de nível de dor inicial | Motor completo de progressão |
| Cadastro/login, perfil, nível de atividade | Não existe | Autenticação e perfil |
| Assinatura recorrente (§15) | Não existe | Pagamento e gating do protocolo |
| Admin (§18) | CRUD de estruturas e exercícios; dashboard simples | Protocolos, fases, critérios, avaliações, usuários, métricas |
| Persistência | `localStorage` por navegador | Backend e banco |

## 2. Adaptação do escopo (IA → motor de regras)

- §1, §13 e §21: substituir "inteligência do sistema" por **motor de regras pré-cadastradas**; textos, lembretes e resumos são templates parametrizados, não geração livre.
- §13 passa a listar apenas: conduzir fluxo de anamnese por formulário, explicar testes com conteúdo cadastrado, exibir rotina da fase, lembrar regras de dor/esforço, comparar reavaliações, acionar regras.
- Adicionar ao admin: edição das regras sem novo deploy (versionadas, com auditoria de quem alterou).

## 3. Especificação do motor de regras (MVP)

Entradas: dor inicial, dor durante a sessão, dor no dia seguinte vs. pré-sessão, adesão semanal, resultados da reavaliação (dor por critério), flags de alerta, fase atual, semanas na fase.
Saídas: `avancar` | `manter` | `ajustar` | `encaminhar`.

Ordem de avaliação (a primeira regra que casar vence):

| # | Condição | Decisão |
|---|---|---|
| 1 | Qualquer sinal de alerta (trauma recente, perda súbita de força, inchaço significativo, sintoma neurológico, incapacidade de executar, dor incompatível, novos sintomas) | **Encaminhar** e interromper o fluxo automático |
| 2 | Piora persistente ou evolução incompatível com o esperado | **Encaminhar** |
| 3 | Dor durante exercício > 4/10 **ou** dor no dia seguinte pior que a pré-sessão **ou** dificuldade relevante de execução | **Ajustar** (reduzir carga/amplitude/complexidade ou retornar etapa) |
| 4 | Reavaliação (a cada 5 semanas), Fase 1: dor < 5/10, sem piora sustentada e com tolerância | **Avançar** para Fase 2 |
| 5 | Reavaliação, Fase 2: dor < 3/10, tolerância à carga e evolução funcional | **Avançar** para Fase 3 |
| 6 | Reavaliação, Fase 3: sem dor nos critérios definidos e tolerância às demandas anteriores | **Avançar** para Fase 4 |
| 7 | Reavaliação, Fase 4: dor 0/10 e retorno funcional adequado | **Concluir** e ofertar manutenção |
| 8 | Melhora parcial, critério ainda não atingido, usuário tolera a fase | **Manter** |

Observações:
- Limiares acima são do escopo v2 e precisam de validação clínica; devem ser **parâmetros editáveis**, não constantes no código.
- Não há compensação de sessões perdidas: o usuário retoma a grade da fase.
- Referências como %CIVM ficam internas; a interface usa esforço-alvo 7/10, limite de dor e resposta no dia seguinte.

## 4. Rotina semanal por fase (parametrizável)

| Fase | Grade |
|---|---|
| 1 | 6 dias isometria |
| 2 | 3 dias isometria + 3 dias HSR alternados |
| 3 | 3 dias potência/absorção + 2 dias isometria alternados |
| 4 | 2–3 sessões de retorno; **grade completa em aberto** |

## 5. Modelo de dados proposto

- `Protocol` (região/tendão, nome, ativo)
- `Phase` (protocolo, ordem, objetivo, estímulo, duração em semanas)
- `PhaseRoutine` (fase, dia da semana, tipo de sessão)
- `Exercise` (existente) + `phaseId`, `sets`, `reps`/`durationSeconds`, `cadence`, `restSeconds`, `targetEffort`, `equipment`, `instructions`, `commonErrors`, `painLimit`, `nextDayGuidance`, `progressionOf`/`regressionOf`
- `AssessmentBattery` / `AssessmentTest` (protocolo, vídeo, reps/tempo, critério de positividade)
- `User`, `UserProfile` (nível de atividade, esporte, frequência, objetivo)
- `Anamnesis` (respostas e flags de alerta)
- `TreatmentPlan` (usuário, protocolo, fase atual, início)
- `SessionLog` (plano, exercício, dor durante, esforço, concluída)
- `NextDayCheck` (sessão, dor, comparação com pré-sessão)
- `Reassessment` (ciclo, resultados por teste, decisão do motor, regra aplicada)
- `RuleSet` / `Rule` (versionado, condição parametrizada, ação)
- `Subscription` (status, ciclo, cancelamento)

Evolução do que existe: as estruturas anatômicas com posições face/lado continuam como seletor de região e passam a se vincular a `Protocol`.

## 6. Plano técnico por fases

**Status da Fase 1 (modelagem e domínio) — concluída nesta etapa:**
- Motor de regras como serviço puro em `src/domain/treatment` (`evaluateTreatmentDecision`), com limiares editáveis (`RuleThresholds`) e testes Vitest cobrindo a tabela da seção 3 (`npm test`).
- Exercício com campos de prescrição cadastráveis pelo admin (aba **Prescrição**): fase, estímulo, séries, repetições, duração, descanso, cadência, esforço-alvo, limite de dor, equipamentos, erros principais, orientação do dia seguinte, progressão/regressão.
- **Tipos de dor cadastráveis** (menu *Tipos de dor*) e vinculados a cada exercício, com opção "Outro" descrita livremente pelo usuário. Um tipo marcado como sinal de alerta interrompe o fluxo e encaminha (regra R1).
**Seed inicial (escopo v2, sem IA) — concluído:**
- Cinco regiões, alinhadas às estruturas do mapa: Ombro (manguito rotador), Cotovelo (epicondilalgia lateral), Quadril/Glúteo (tendinopatia glútea), Joelho (patelar) e Tornozelo (Aquiles).
- **Avaliativos (seção 7):** 2 a 4 testes por região, com as repetições/tempos do escopo (elevação no plano escapular ×10, Heel Rise ×25, Single Leg Decline Squat ×10 a 40°, sustentação unipodal 30 s, extensão do punho ×10 etc.). Cada um oferece os tipos de dor comuns e os sinais de alerta (formigamento, perda súbita de força, inchaço, não consegui executar).
- **Terapêuticos (seções 8 e 9):** por região, 2 isometrias da Fase 1 (4 séries de 45 s, descanso 90 s) e 1 HSR da Fase 2 (4×8, cadência 3 s/3 s, descanso 3 min), todos com esforço-alvo 7/10, dor até 4/10, equipamentos, erros principais e orientação do dia seguinte. A isometria progride para o HSR e o HSR regride para a isometria.
- **Grupos:** bateria avaliativa por região; **Plano Fase 1** ativo (dor máxima de 0 a 6 na bateria) e **Plano Fase 2** inativo (HSR + isometria), reservado à progressão por reavaliação.
- O usuário vê a prescrição de cada exercício do plano (séries, tempo, descanso, esforço, limite de dor).
- Dados já salvos no navegador recebem o seed por mesclagem (`seedStorage.ts`, versão `2026-10-09-escopo-v2`): edições do admin são preservadas e só os exemplos antigos (9 exercícios e 6 grupos) são removidos.
- **Pendências do seed:** os textos e parâmetros são rascunhos com valores intermediários das faixas do escopo e precisam ser validados pelo educador físico; não há vídeos (cadastrar no admin); Fases 3 e 4 ainda não têm exercícios; critérios de positividade dos testes seguem em aberto.

- Pendente na Fase 1: entidades `Protocol`, `Phase`, `PhaseRoutine`, `TreatmentPlan`, `SessionLog`, `NextDayCheck`, `Reassessment`, `RuleSet`; persistência dos limiares no admin.

**Grupos de exercícios (bateria → plano) — concluído:**
- `ExerciseGroup` com dois tipos: **grupo avaliativo** (bateria de exercícios avaliativos de uma estrutura, com ordem de execução) e **plano terapêutico** (exercícios terapêuticos vinculados a uma faixa de dor `minPain`–`maxPain`). Admin: menus *Grupos avaliativos* e *Planos terapêuticos*.
- O `/assessment` aplica a bateria inteira (cada exercício com vídeo, dor 0–10 e tipos de dor). A **maior dor da bateria** (`summarizeGroupResult`) escolhe o plano cuja faixa a contém (`selectPlanGroup`; havendo sobreposição vence a faixa mais estreita).
- Dor alta (7–10) e sinais de alerta de qualquer exercício continuam bloqueando o plano e encaminhando. Sem plano cadastrado para a faixa, cai na regra por estrutura.
- Testes em `GroupRecommendationService.test.ts`. Limitação: o critério de seleção hoje é só a maior dor; critérios adicionais (tipos de dor, média) podem entrar nas regras depois.

1. **Modelagem e domínio** — tipos e contratos para os itens da seção 5; motor de regras como serviço puro (já existe padrão em `RecommendationService`) com **testes unitários** cobrindo a tabela da seção 3. Adicionar Vitest.
2. **Backend** — API e banco (autenticação, anamnese, avaliação, sessões, motor de regras, assinatura); migrar repositórios `localStorage` para API mantendo os contratos atuais.
3. **Frontend** — onboarding (cadastro, atividade, anamnese), avaliação com descritores de dor, resultado gratuito, agenda semanal, registro de sessão e dia seguinte, reavaliação; admin para protocolos, fases, regras e métricas.
4. **Pagamento e admin** — assinatura recorrente e gating do tratamento completo; métricas clínicas e de produto (§19).
5. **Validação** — testes com usuários reais e validação clínica dos limiares, vídeos e critérios de positividade.
6. **Lançamento do MVP** — coleta de métricas, revisão jurídica/regulatória.

Responsáveis e cronograma: a definir com Daniel e André; depende do fechamento das pendências abaixo.

## 7. Pendências que bloqueiam a implementação

- **Conteúdo do educador físico não foi inserido** no documento (placeholder vazio): exercícios por tendão, progressões/regressões, cadências, séries, reps, perfis.
- Grade completa da Fase 4.
- Exercícios exatos e progressões/regressões dos cinco protocolos.
- Descritores finais da escala de dor e forma de apresentação.
- Critérios completos de positividade de cada bateria de avaliação.
- Operacionalização da intensidade em casa sem %CIVM.
- Política de atrasos, faltas e retomada.
- Validação clínica dos limiares e jurídica da comunicação.

## 8. Entregáveis

- Este plano e o escopo atualizado (após receber o conteúdo do educador físico).
- Especificação do motor de regras (seção 3), a ser transformada em testes.
- Protótipo navegável: já existe o fluxo `/assessment` e o admin; próximos incrementos seguem a seção 6.
