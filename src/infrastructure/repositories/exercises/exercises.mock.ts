import type { Exercise } from '@/domain/exercises'

const timestamp = '2026-10-09T12:00:00.000Z'

/** Vídeo provisório de todos os exercícios do seed; substitua pelos vídeos reais no admin. */
export const seedVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

/**
 * Seed baseado no escopo v2 (seções 7, 8 e 9). Os parâmetros usam valores intermediários
 * das faixas do escopo e os textos são rascunhos para validação do educador físico e dos
 * responsáveis técnicos. Vídeos não foram incluídos: cadastre os links no admin.
 */
const generalPainTypes = ['local-tendon', 'pinching', 'stiffness', 'burning']
const alertPainTypes = ['tingling', 'sudden-weakness', 'swelling', 'unable-to-perform']

const nextDayGuidance =
  'No dia seguinte, a dor não deve estar pior do que estava antes da sessão. Se estiver, reduza a carga na próxima sessão.'

interface ExerciseSeed {
  id: string
  name: string
  description: string
  instructions: string
  equipment?: string
  commonErrors?: string
  reps?: number
  durationSeconds?: number
  progressionExerciseId?: string
  regressionExerciseId?: string
}

function common(structureId: string, kind: Exercise['kind'], seed: ExerciseSeed): Exercise {
  return {
    id: seed.id,
    kind,
    anatomicalStructureId: structureId,
    targets: [{ anatomicalStructureId: structureId, allPlacements: true }],
    name: seed.name,
    slug: seed.id,
    description: seed.description,
    instructions: seed.instructions,
    youtubeUrl: seedVideoUrl,
    equipment: seed.equipment,
    commonErrors: seed.commonErrors,
    progressionExerciseId: seed.progressionExerciseId,
    regressionExerciseId: seed.regressionExerciseId,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function evaluation(structureId: string, seed: ExerciseSeed): Exercise {
  return {
    ...common(structureId, 'evaluation', seed),
    reps: seed.reps,
    durationSeconds: seed.durationSeconds,
    painTypeIds: [...generalPainTypes, ...alertPainTypes],
    allowOtherPainDescription: true,
  }
}

/** Fase 1: isometria, 4 séries de 45 s, descanso de 90 s, esforço 7/10, dor até 4/10. */
function isometric(structureId: string, seed: ExerciseSeed): Exercise {
  return {
    ...common(structureId, 'therapeutic', seed),
    phase: 1,
    stimulus: 'isometric',
    sets: 4,
    durationSeconds: 45,
    restSeconds: 90,
    targetEffort: 7,
    painLimit: 4,
    nextDayGuidance,
  }
}

/** Fase 2: HSR, 4 séries de 8 repetições, cadência 3 s / 3 s, descanso de 3 min. */
function hsr(structureId: string, seed: ExerciseSeed): Exercise {
  return {
    ...common(structureId, 'therapeutic', seed),
    phase: 2,
    stimulus: 'hsr',
    sets: 4,
    reps: 8,
    cadence: '3 s subindo / 3 s descendo',
    restSeconds: 180,
    targetEffort: 7,
    painLimit: 4,
    nextDayGuidance,
  }
}

export const exercisesMock: Exercise[] = [
  // Ombro — tendinopatia do manguito rotador
  evaluation('shoulder', {
    id: 'shoulder-eval-scaption',
    name: 'Elevação no plano escapular',
    description: 'Elevação do braço no plano da escápula, 10 repetições.',
    instructions: 'Em pé, com o braço ao lado do corpo e o polegar para cima, eleve o braço lentamente cerca de 30° à frente do corpo, até a altura do ombro, e desça devagar. Faça 10 repetições e registre a maior dor sentida.',
    equipment: 'Nenhum',
    reps: 10,
  }),
  evaluation('shoulder', {
    id: 'shoulder-eval-jobe',
    name: 'Lateral Jobe Test',
    description: 'Braço sustentado a 90° com o polegar para baixo.',
    instructions: 'Com o braço elevado a 90° no plano da escápula e o polegar apontando para baixo, sustente a posição por 5 segundos, sem peso ou com um peso muito leve, e registre a dor.',
    equipment: 'Nenhum',
    durationSeconds: 5,
  }),
  evaluation('shoulder', {
    id: 'shoulder-eval-hawkins',
    name: 'Hawkins-Kennedy',
    description: 'Rotação interna do ombro com o cotovelo a 90°.',
    instructions: 'Com o braço à frente na altura do ombro e o cotovelo dobrado a 90°, gire lentamente o antebraço para baixo até o limite confortável. Registre a dor sentida na parte superior do ombro.',
    equipment: 'Nenhum',
  }),
  isometric('shoulder', {
    id: 'shoulder-iso-scaption',
    name: 'Isometria de elevação no plano escapular',
    description: 'Contração sustentada do ombro contra a parede, sem movimento.',
    instructions: 'Em pé, ao lado da parede, com o braço cerca de 30° à frente e o cotovelo estendido, empurre o dorso da mão contra a parede sem mover o braço e sustente a contração no ângulo mais tolerável.',
    equipment: 'Parede',
    commonErrors: 'Encolher o ombro; prender a respiração; empurrar até a dor passar de 4/10.',
    progressionExerciseId: 'shoulder-hsr-scaption',
  }),
  isometric('shoulder', {
    id: 'shoulder-iso-external-rotation',
    name: 'Isometria de rotação externa',
    description: 'Rotação externa sustentada contra a parede.',
    instructions: 'Em pé, de lado para a parede, com o cotovelo dobrado a 90° junto ao corpo, empurre o dorso da mão para fora contra a parede sem movimento e sustente.',
    equipment: 'Parede',
    commonErrors: 'Afastar o cotovelo do corpo; girar o tronco.',
  }),
  hsr('shoulder', {
    id: 'shoulder-hsr-scaption',
    name: 'Elevação no plano escapular com carga (HSR)',
    description: 'Elevação lenta do braço com carga progressiva.',
    instructions: 'Com um halter, eleve o braço no plano da escápula até a altura do ombro em 3 segundos e desça em 3 segundos. Aumente a carga aos poucos, mantendo esforço 7/10.',
    equipment: 'Halter ou elástico',
    commonErrors: 'Subir acima da altura do ombro; balançar o tronco; pressa na descida.',
    regressionExerciseId: 'shoulder-iso-scaption',
  }),

  // Cotovelo — epicondilalgia lateral
  evaluation('elbow', {
    id: 'elbow-eval-wrist-extension',
    name: 'Extensão do punho',
    description: 'Extensão do punho com peso leve, 10 repetições.',
    instructions: 'Sentado, apoie o antebraço na mesa com a palma para baixo e a mão para fora da borda. Com um peso leve, estenda o punho lentamente, desça devagar e repita 10 vezes. Registre a maior dor sentida na parte externa do cotovelo.',
    equipment: 'Halter leve ou garrafa pequena',
    reps: 10,
  }),
  evaluation('elbow', {
    id: 'elbow-eval-cozen',
    name: 'Cozen Test',
    description: 'Extensão do punho contra resistência com o cotovelo dobrado.',
    instructions: 'Com o cotovelo dobrado a 90° e a palma para baixo, feche a mão e estenda o punho enquanto a outra mão oferece resistência por 5 segundos. Registre a dor na parte externa do cotovelo.',
    equipment: 'Nenhum',
    durationSeconds: 5,
  }),
  evaluation('elbow', {
    id: 'elbow-eval-maudsley',
    name: 'Maudsley Test',
    description: 'Extensão do dedo médio contra resistência.',
    instructions: 'Com o cotovelo estendido e a palma para baixo, estenda o dedo médio contra a resistência do dedo da outra mão por 5 segundos e registre a dor na parte externa do cotovelo.',
    equipment: 'Nenhum',
    durationSeconds: 5,
  }),
  isometric('elbow', {
    id: 'elbow-iso-wrist-extension',
    name: 'Isometria de extensão de punho',
    description: 'Extensão do punho sustentada, sem movimento.',
    instructions: 'Sentado, apoie o antebraço na mesa com a palma para baixo. Segure um halter com o punho levemente estendido e mantenha a posição, ou empurre a mão para cima contra a resistência da outra mão, sustentando a contração.',
    equipment: 'Halter ou a outra mão',
    commonErrors: 'Mover o cotovelo; usar o ombro; dor acima de 4/10.',
    progressionExerciseId: 'elbow-hsr-wrist-extension',
  }),
  isometric('elbow', {
    id: 'elbow-iso-grip',
    name: 'Isometria de preensão',
    description: 'Preensão sustentada de uma bola ou toalha enrolada.',
    instructions: 'Com o cotovelo apoiado e o antebraço em posição neutra, aperte uma bola ou toalha enrolada com esforço 7/10 e sustente a contração.',
    equipment: 'Bola de borracha ou toalha enrolada',
    commonErrors: 'Apertar com força máxima; prender a respiração.',
  }),
  hsr('elbow', {
    id: 'elbow-hsr-wrist-extension',
    name: 'Extensão de punho com carga (HSR)',
    description: 'Extensão lenta do punho com carga progressiva.',
    instructions: 'Com o antebraço apoiado e a palma para baixo, estenda o punho em 3 segundos e desça em 3 segundos segurando um halter. Aumente a carga aos poucos, mantendo esforço 7/10.',
    equipment: 'Halter',
    commonErrors: 'Levantar o antebraço da mesa; descer rápido demais.',
    regressionExerciseId: 'elbow-iso-wrist-extension',
  }),

  // Quadril — tendinopatia glútea
  evaluation('gluteus', {
    id: 'gluteus-eval-trochanter-palpation',
    name: 'Palpação do trocânter maior',
    description: 'Pressão suave sobre a saliência óssea lateral do quadril.',
    instructions: 'Deitado de lado, com a perna de cima apoiada, pressione com os dedos a saliência óssea na lateral do quadril por 5 segundos e registre a dor.',
    equipment: 'Nenhum',
    durationSeconds: 5,
  }),
  evaluation('gluteus', {
    id: 'gluteus-eval-abductor-strength',
    name: 'Teste de força dos abdutores',
    description: 'Elevação lateral da perna, 10 repetições.',
    instructions: 'Deitado de lado, com a perna de baixo dobrada, eleve a perna de cima estendida até cerca de 45°, sem girar o quadril, e desça devagar. Faça 10 repetições e registre a dor na lateral do quadril.',
    equipment: 'Colchonete',
    reps: 10,
  }),
  evaluation('gluteus', {
    id: 'gluteus-eval-single-leg-stance',
    name: 'Sustentação unipodal',
    description: 'Apoio em uma perna só por 30 segundos.',
    instructions: 'Em pé, perto de um apoio por segurança, fique em uma perna só com o quadril alinhado, sem se inclinar, por 30 segundos. Registre a dor na lateral do quadril.',
    equipment: 'Parede ou cadeira para apoio',
    durationSeconds: 30,
  }),
  isometric('gluteus', {
    id: 'gluteus-iso-abduction',
    name: 'Isometria de abdução do quadril',
    description: 'Abdução sustentada contra a parede, sem cruzar a linha do corpo.',
    instructions: 'Em pé, de lado para a parede, empurre a lateral da perna contra a parede mantendo o quadril alinhado e o tronco reto, e sustente. Evite cruzar a perna na frente do corpo.',
    equipment: 'Parede',
    commonErrors: 'Inclinar o tronco; cruzar a perna (aumenta a compressão sobre o tendão).',
    progressionExerciseId: 'gluteus-hsr-bridge',
  }),
  isometric('gluteus', {
    id: 'gluteus-iso-bridge',
    name: 'Isometria de ponte',
    description: 'Ponte sustentada com o quadril elevado.',
    instructions: 'Deitado de costas, com os joelhos dobrados, eleve o quadril e sustente a posição com os glúteos contraídos, sem arquear a lombar.',
    equipment: 'Colchonete',
    commonErrors: 'Arquear a lombar; afastar demais os pés.',
  }),
  hsr('gluteus', {
    id: 'gluteus-hsr-bridge',
    name: 'Ponte com carga progressiva (HSR)',
    description: 'Elevação lenta do quadril com carga progressiva.',
    instructions: 'Deitado de costas, com uma carga apoiada sobre o quadril, eleve o quadril em 3 segundos e desça em 3 segundos. Aumente a carga aos poucos, mantendo esforço 7/10.',
    equipment: 'Halter ou anilha',
    commonErrors: 'Subir além da linha do tronco; descer rápido demais.',
    regressionExerciseId: 'gluteus-iso-bridge',
  }),

  // Joelho — tendinopatia patelar
  evaluation('knee', {
    id: 'knee-eval-decline-squat',
    name: 'Agachamento unipodal em declive',
    description: 'Single Leg Decline Squat em rampa de 40°, 10 repetições.',
    instructions: 'Em pé sobre uma rampa inclinada a 40°, com o calcanhar elevado, agache em uma perna só até um ângulo confortável e suba devagar. Faça 10 repetições e registre a maior dor sentida na frente do joelho.',
    equipment: 'Rampa ou prancha de declive de 40°',
    reps: 10,
  }),
  evaluation('knee', {
    id: 'knee-eval-royal-london',
    name: 'Royal London Hospital Test',
    description: 'Palpação do tendão patelar com o joelho estendido e dobrado.',
    instructions: 'Sentado, com o joelho estendido e a perna relaxada, pressione suavemente o ponto doloroso abaixo da patela e registre a dor. Depois dobre o joelho a 90° e pressione o mesmo ponto, registrando novamente.',
    equipment: 'Nenhum',
  }),
  isometric('knee', {
    id: 'knee-iso-extension',
    name: 'Isometria de extensão de joelho',
    description: 'Extensão sustentada em ângulo tolerável.',
    instructions: 'Sentado, com o joelho dobrado em um ângulo confortável (cerca de 60°), estenda a perna contra uma resistência fixa e sustente a contração.',
    equipment: 'Cadeira extensora travada ou elástico preso',
    commonErrors: 'Mudar o ângulo durante a série; compensar com o quadril.',
    progressionExerciseId: 'knee-hsr-squat',
  }),
  isometric('knee', {
    id: 'knee-iso-wall-sit',
    name: 'Isometria de agachamento na parede',
    description: 'Agachamento sustentado com as costas apoiadas.',
    instructions: 'Com as costas apoiadas na parede, desça até um ângulo de joelho confortável e sustente, com os joelhos alinhados aos pés.',
    equipment: 'Parede',
    commonErrors: 'Joelhos para dentro; descer além do ângulo tolerável.',
  }),
  hsr('knee', {
    id: 'knee-hsr-squat',
    name: 'Agachamento com carga progressiva (HSR)',
    description: 'Agachamento lento com carga progressiva.',
    instructions: 'Agache em 3 segundos até um ângulo confortável e suba em 3 segundos, com halteres ou no leg press. Aumente a carga aos poucos, mantendo esforço 7/10.',
    equipment: 'Leg press ou halteres',
    commonErrors: 'Descer rápido; joelhos para dentro; ultrapassar a amplitude tolerável.',
    regressionExerciseId: 'knee-iso-extension',
  }),

  // Tornozelo — tendinopatia do tendão de Aquiles
  evaluation('ankle', {
    id: 'ankle-eval-heel-rise',
    name: 'Heel Rise Test',
    description: 'Elevação de calcanhar em uma perna, até 25 repetições.',
    instructions: 'Em pé sobre uma perna, com apoio leve na parede, suba nos dedos do pé até a altura máxima tolerável e desça devagar. Faça até 25 repetições e registre a maior dor sentida no tendão de Aquiles.',
    equipment: 'Parede para apoio',
    reps: 25,
  }),
  evaluation('ankle', {
    id: 'ankle-eval-arc-sign',
    name: 'Arc Sign',
    description: 'Observa se o ponto doloroso acompanha o movimento do tornozelo.',
    instructions: 'Sentado, localize com os dedos o ponto engrossado e doloroso do tendão. Mova o pé para cima e para baixo e observe se o ponto acompanha o movimento do tornozelo. Registre a dor.',
    equipment: 'Nenhum',
  }),
  evaluation('ankle', {
    id: 'ankle-eval-royal-london',
    name: 'Royal London Hospital Test',
    description: 'Palpação do tendão de Aquiles em duas posições do tornozelo.',
    instructions: 'Com o pé relaxado, pressione o ponto doloroso do tendão e registre a dor. Depois puxe o pé para cima (dorsiflexão) e pressione o mesmo ponto, registrando novamente.',
    equipment: 'Nenhum',
  }),
  evaluation('ankle', {
    id: 'ankle-eval-pinch',
    name: 'Pinch Test',
    description: 'Pinçamento do tendão de Aquiles.',
    instructions: 'Com o pé relaxado, pince o tendão entre o polegar e o indicador, na região dolorosa, com pressão moderada por 3 segundos e registre a dor.',
    equipment: 'Nenhum',
    durationSeconds: 3,
  }),
  isometric('ankle', {
    id: 'ankle-iso-heel-raise',
    name: 'Isometria de elevação de calcanhar',
    description: 'Elevação sustentada na ponta dos pés.',
    instructions: 'Em pé, com leve apoio na parede, suba nos dedos até uma altura tolerável e sustente a posição.',
    equipment: 'Parede',
    commonErrors: 'Balançar o corpo; deixar o tornozelo cair para os lados.',
    progressionExerciseId: 'ankle-hsr-heel-raise',
  }),
  isometric('ankle', {
    id: 'ankle-iso-seated-calf',
    name: 'Isometria de panturrilha sentado',
    description: 'Elevação sustentada de calcanhar com o joelho dobrado.',
    instructions: 'Sentado, com os pés no chão e uma carga sobre os joelhos, eleve os calcanhares e sustente a posição.',
    equipment: 'Anilha ou mochila com peso',
    commonErrors: 'Carga excessiva; perder a altura durante a série.',
  }),
  hsr('ankle', {
    id: 'ankle-hsr-heel-raise',
    name: 'Elevação de calcanhar com carga (HSR)',
    description: 'Elevação lenta de calcanhar com carga progressiva.',
    instructions: 'Em pé no degrau, suba nos dedos em 3 segundos e desça em 3 segundos, com halteres. Aumente a carga aos poucos, mantendo esforço 7/10.',
    equipment: 'Degrau e halteres',
    commonErrors: 'Descer rápido; não completar a amplitude confortável.',
    regressionExerciseId: 'ankle-iso-heel-raise',
  }),
]

/** Exercícios de exemplo antigos, substituídos por este seed. */
export const legacyExerciseIds = [
  'shoulder-mobility',
  'shoulder-evaluation',
  'shoulder-elevation-evaluation',
  'shoulder-isometric',
  'knee-strengthening',
  'knee-evaluation',
  'knee-decline-squat-evaluation',
  'knee-isometric',
  'ankle-mobility',
]

export const exercisesSeedVersion = '2026-10-09-escopo-v2-videos'
