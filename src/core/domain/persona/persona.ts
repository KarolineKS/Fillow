import type { StateUf } from "../shared/state-uf";

/** Plain readonly data: it crosses extension messaging, which drops class instances (AD-001). */
export interface Persona {
  readonly fullName: string;
  readonly email: string;
  readonly birthDate: string;
  readonly age: number;
  readonly cpf: string;
  readonly cnpj: string;
  readonly rg: string;
  readonly cnh: string;
  readonly ctps: { readonly number: string; readonly series: string; readonly stateUf: StateUf };
  readonly pis: string;
  readonly voterId: string;
  readonly address: {
    readonly cep: string;
    readonly street: string;
    readonly number: string;
    readonly neighborhood: string;
    readonly city: string;
    readonly stateUf: StateUf;
  };
  readonly phones: { readonly mobile: string; readonly landline: string };
}

export interface PersonaRequest {
  /** "YYYY-MM-DD"; ages are computed against it so output never depends on the clock. */
  readonly referenceDate: string;
  readonly minAge?: number;
  readonly maxAge?: number;
  readonly stateUf?: string;
  /** Masked document fields when true (default), digits-only when false. */
  readonly formatted?: boolean;
}

export interface PersonaBatchRequest extends PersonaRequest {
  readonly count: number;
}
