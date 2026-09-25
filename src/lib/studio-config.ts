/**
 * Studio Configuration Store — Smoke M Customs
 * PRD §10 & Architecture §6.2
 *
 * Manages global scheduling tolerances, buffer durations, and lead time policies.
 */

export interface BookingRulesConfig {
  bufferMinutes: number;
  minLeadTimeHours: number;
  slotGranularityMinutes: number;
}

const activeConfig: BookingRulesConfig = {
  bufferMinutes: 15,
  minLeadTimeHours: 2,
  slotGranularityMinutes: 30,
};

export function getBookingRules(): BookingRulesConfig {
  return { ...activeConfig };
}

export function updateBookingRules(newRules: Partial<BookingRulesConfig>): BookingRulesConfig {
  if (newRules.bufferMinutes !== undefined) {
    activeConfig.bufferMinutes = Number(newRules.bufferMinutes);
  }
  if (newRules.minLeadTimeHours !== undefined) {
    activeConfig.minLeadTimeHours = Number(newRules.minLeadTimeHours);
  }
  if (newRules.slotGranularityMinutes !== undefined) {
    activeConfig.slotGranularityMinutes = Number(newRules.slotGranularityMinutes);
  }
  return { ...activeConfig };
}
