import { Cep } from "../documents/cep";
import { Cnh } from "../documents/cnh";
import { Cnpj } from "../documents/cnpj";
import { Cpf } from "../documents/cpf";
import { Ctps } from "../documents/ctps";
import { PhoneBr } from "../documents/phone-br";
import { Pis } from "../documents/pis";
import { Rg } from "../documents/rg";
import { VoterId } from "../documents/voter-id";
import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { BRAZILIAN_STATES, isStateUf, type StateUf } from "../shared/state-uf";
import { BirthDate } from "./birth-date";
import { CITIES, FIRST_NAMES, NEIGHBORHOODS, RESERVED_EMAIL_DOMAINS, STREET_TYPES, SURNAMES } from "./name-catalog";
import type { Persona, PersonaBatchRequest, PersonaRequest } from "./persona";

const DEFAULT_MIN_AGE = 18;
const DEFAULT_MAX_AGE = 80;
const MAX_AGE_BOUND = 120;
const MAX_BATCH = 50;
const MAX_UNIQUE_ATTEMPTS = 100;

interface ResolvedRequest {
  readonly reference: BirthDate;
  readonly minAge: number;
  readonly maxAge: number;
  readonly stateUf: StateUf | undefined;
  readonly formatted: boolean;
}

function resolve(request: PersonaRequest): Result<ResolvedRequest, DomainError> {
  return Result.flatMap(BirthDate.parse(request.referenceDate), (reference) => {
    // A lone bound pulls the missing default along so it never contradicts the caller.
    const minAge = request.minAge ?? Math.min(DEFAULT_MIN_AGE, request.maxAge ?? DEFAULT_MIN_AGE);
    const maxAge = request.maxAge ?? Math.max(minAge, DEFAULT_MAX_AGE);
    const inBounds = (age: number): boolean => Number.isInteger(age) && age >= 0 && age <= MAX_AGE_BOUND;
    if (!inBounds(minAge) || !inBounds(maxAge) || minAge > maxAge) {
      return Result.err(
        DomainError.outOfRange(`Age bounds must be integers with 0 <= minAge <= maxAge <= ${MAX_AGE_BOUND}`),
      );
    }
    if (request.stateUf !== undefined && !isStateUf(request.stateUf)) {
      return Result.err(DomainError.invalidStateUf(`"${request.stateUf}" is not a Brazilian UF`));
    }
    return Result.ok({
      reference,
      minAge,
      maxAge,
      stateUf: request.stateUf,
      formatted: request.formatted ?? true,
    });
  });
}

function asciiSlug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function buildPersona(random: RandomSource, request: ResolvedRequest): Persona {
  const stateUf = request.stateUf ?? random.pick(BRAZILIAN_STATES);
  const firstName = random.pick(FIRST_NAMES);
  const middleName = random.pick(SURNAMES);
  const lastName = random.pick(SURNAMES);
  const age = random.nextInt(request.minAge, request.maxAge);
  const birthDate = BirthDate.forAge(random, age, request.reference);
  const emailSuffix = String(random.nextInt(10, 9999));
  const email = `${asciiSlug(firstName)}.${asciiSlug(lastName)}${emailSuffix}@${random.pick(RESERVED_EMAIL_DOMAINS)}`;

  const cpf = Cpf.generate(random);
  const cnpj = Cnpj.generate(random);
  const rg = Rg.generate(random);
  const cnh = Cnh.generate(random);
  const pis = Pis.generate(random);
  const voterId = VoterId.generate(random, stateUf);
  const ctps = Ctps.generate(random, stateUf);
  const cep = Cep.generate(random, stateUf);
  const mobile = PhoneBr.generateMobile(random, stateUf);
  const landline = PhoneBr.generateLandline(random, stateUf);
  const pick = (masked: { digits: string; formatted: string }): string =>
    request.formatted ? masked.formatted : masked.digits;

  return {
    fullName: `${firstName} ${middleName} ${lastName}`,
    email,
    birthDate: birthDate.iso,
    age,
    cpf: pick(cpf),
    cnpj: pick(cnpj),
    rg: request.formatted ? rg.formatted : rg.value,
    cnh: cnh.digits,
    ctps,
    pis: pick(pis),
    voterId: pick(voterId),
    address: {
      cep: pick(cep),
      street: `${random.pick(STREET_TYPES)} ${random.pick(FIRST_NAMES)} ${random.pick(SURNAMES)}`,
      number: String(random.nextInt(1, 9999)),
      neighborhood: random.pick(NEIGHBORHOODS),
      city: random.pick(CITIES[stateUf]),
      stateUf,
    },
    phones: { mobile: pick(mobile), landline: pick(landline) },
  };
}

function uniqueKeys(persona: Persona): readonly string[] {
  return [
    `cpf:${persona.cpf.replace(/\D/g, "")}`,
    `pis:${persona.pis.replace(/\D/g, "")}`,
    `ctps:${persona.ctps.number}`,
    `email:${persona.email}`,
  ];
}

export const DeterministicGeneratorService = {
  generatePersona(request: PersonaRequest, random: RandomSource): Result<Persona, DomainError> {
    return Result.map(resolve(request), (resolved) => buildPersona(random, resolved));
  },

  /** N personas whose CPF, PIS, CTPS number and email never repeat within the batch. */
  generatePersonas(request: PersonaBatchRequest, random: RandomSource): Result<Persona[], DomainError> {
    if (!Number.isInteger(request.count) || request.count < 1 || request.count > MAX_BATCH) {
      return Result.err(DomainError.outOfRange(`count must be an integer from 1 to ${MAX_BATCH}`));
    }
    return Result.flatMap(resolve(request), (resolved) => {
      const issued = new Set<string>();
      const personas: Persona[] = [];
      while (personas.length < request.count) {
        let accepted: Persona | undefined;
        for (let attempt = 0; attempt < MAX_UNIQUE_ATTEMPTS && accepted === undefined; attempt += 1) {
          const candidate = buildPersona(random, resolved);
          if (uniqueKeys(candidate).every((key) => !issued.has(key))) {
            accepted = candidate;
          }
        }
        if (accepted === undefined) {
          return Result.err(
            DomainError.generationFailed(
              `Could not produce a unique persona #${personas.length + 1} in ${MAX_UNIQUE_ATTEMPTS} attempts`,
            ),
          );
        }
        uniqueKeys(accepted).forEach((key) => issued.add(key));
        personas.push(accepted);
      }
      return Result.ok(personas);
    });
  },
} as const;
