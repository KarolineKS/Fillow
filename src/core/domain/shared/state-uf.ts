export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type StateUf = (typeof BRAZILIAN_STATES)[number];

export function isStateUf(value: string): value is StateUf {
  return (BRAZILIAN_STATES as readonly string[]).includes(value);
}
