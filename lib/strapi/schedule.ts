/**
 * Helpers for converting datetime values between BRT (America/Sao_Paulo)
 * and UTC ISO timestamps used by `strapi-plugin-publisher`.
 *
 * Curitiba follows Brasília time (BRT, UTC-3) and has NOT observed DST since
 * 2019, so the offset is fixed at -03:00 year-round.
 */

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000

/**
 * Treats `local` as BRT wall-clock and returns the UTC ISO timestamp.
 * Example: `"2026-06-01T00:00"` → `"2026-06-01T03:00:00.000Z"`
 */
export function brtLocalToUtcIso(local: string): string {
  return new Date(`${local}:00-03:00`).toISOString()
}

/**
 * Inverse of `brtLocalToUtcIso`. Takes a UTC ISO and returns the BRT
 * wall-clock as `YYYY-MM-DDTHH:MM` (suitable for `<input type="datetime-local">`).
 * Example: `"2027-02-28T03:00:00.000Z"` → `"2027-02-28T00:00"`
 */
export function utcIsoToBrtLocal(iso: string): string {
  const utc = new Date(iso).getTime()
  const brt = new Date(utc - BRT_OFFSET_MS)
  return brt.toISOString().slice(0, 16)
}
