import type { EntityId } from '@/domain/common/types'

export interface PainType {
  id: EntityId
  name: string
  slug: string
  description: string
  /** Quando selecionado, o motor interrompe o fluxo automático e encaminha. */
  isAlertSign: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}
