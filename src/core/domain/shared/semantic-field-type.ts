/** Closed set every slice classifies into (scanner) and generates for (filler, auditor). */
export const SEMANTIC_FIELD_TYPES = [
  "cpf",
  "cnpj",
  "rg",
  "cnh",
  "ctps",
  "pis",
  "voterId",
  "cep",
  "phone",
  "email",
  "fullName",
  "birthDate",
  "creditCard",
  "licensePlate",
  "money",
  "number",
  "text",
] as const;

export type SemanticFieldType = (typeof SEMANTIC_FIELD_TYPES)[number];
