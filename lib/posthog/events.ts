// Nomes de eventos centralizados — snake_case, consistentes entre cliente e
// servidor. Importar daqui em vez de hardcodear strings evita typos e drift.
export const OFERTAS_EVENTS = {
  // Dashboard /ofertas
  dashboardViewed: 'ofertas_dashboard_viewed',
  // CRUD /ofertas-regiao
  editSheetOpened: 'oferta_edit_sheet_opened',
  deleteDialogOpened: 'oferta_delete_dialog_opened',
  formSubmitted: 'oferta_form_submitted',
  updated: 'oferta_updated',
  updateFailed: 'oferta_update_failed',
  deleteConfirmed: 'oferta_delete_confirmed',
  deleted: 'oferta_deleted',
  deleteFailed: 'oferta_delete_failed',
} as const

export type OfertaEvent = (typeof OFERTAS_EVENTS)[keyof typeof OFERTAS_EVENTS]
