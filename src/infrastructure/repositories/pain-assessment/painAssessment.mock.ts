import type { CreatePainAssessmentInput } from '@/domain/pain-assessment'

export const painAssessmentMock: CreatePainAssessmentInput = {
  userId: 'demo-user',
  painArea: {
    anatomicalStructureId: 'brain',
    side: 'not-applicable',
  },
  initialPainScore: 3,
}
