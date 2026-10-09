interface FormWizardActionsProps {
  tabIndex: number
  tabCount: number
  isEditing: boolean
  saving: boolean
  saveLabel: string
  onPrevious: () => void
  onNext: () => void
  onCancel: () => void
}

/**
 * Ações do formulário em abas. Na criação é preciso percorrer todas as abas e só a última
 * salva; na edição o botão Salvar fica disponível em qualquer aba. Cancelar sempre volta à lista.
 */
export function FormWizardActions({
  tabIndex,
  tabCount,
  isEditing,
  saving,
  saveLabel,
  onPrevious,
  onNext,
  onCancel,
}: FormWizardActionsProps) {
  const isFirst = tabIndex === 0
  const isLast = tabIndex === tabCount - 1
  const canSave = isEditing || isLast

  return (
    <div className="form-actions wizard-actions wide">
      <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
      {!isFirst && <button type="button" className="secondary" onClick={onPrevious}>Voltar</button>}
      {!isLast && <button type="button" className={canSave ? 'secondary' : undefined} onClick={onNext}>Avançar</button>}
      {canSave && <button type="submit" disabled={saving}>{saving ? 'Salvando...' : saveLabel}</button>}
    </div>
  )
}
