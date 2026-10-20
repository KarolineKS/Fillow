import type { SemanticFieldType } from "../shared/semantic-field-type";

/** A value typed into a field to probe how the form reacts; plain data (AD-001), English copy keyed by `reasonCode` (AD-003). */
export interface TestPayload {
  readonly kind: "invalid" | "fuzz";
  readonly fieldType: SemanticFieldType;
  readonly value: string;
  readonly reasonCode: string;
  readonly explanation: string;
}
