import type { StateUf } from "../shared/state-uf";

export const FIRST_NAMES = [
  "Ana", "João", "Maria", "José", "Francisca", "Antônio", "Juliana", "Carlos", "Márcia", "Paulo",
  "Letícia", "Lucas", "Fernanda", "Rafael", "Beatriz", "Gustavo", "Camila", "Thiago", "Larissa", "Felipe",
  "Patrícia", "Bruno", "Vitória", "André", "Sônia", "Diego", "Aline", "Mateus", "Cecília", "Otávio",
] as const;

export const SURNAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
  "Costa", "Ribeiro", "Martins", "Carvalho", "Araújo", "Melo", "Barbosa", "Rocha", "Dias", "Nascimento",
  "Conceição", "Moreira", "Cardoso", "Teixeira", "Mendes", "Brandão", "Assunção", "Gonçalves", "Freitas", "Simões",
] as const;

export const STREET_TYPES = ["Rua", "Avenida", "Travessa", "Alameda"] as const;

export const NEIGHBORHOODS = [
  "Centro", "Jardim América", "Vila Nova", "Boa Vista", "Santa Cecília", "São José",
  "Bela Vista", "Jardim das Flores", "Parque Industrial", "Cidade Alta",
] as const;

export const CITIES: Readonly<Record<StateUf, readonly string[]>> = {
  AC: ["Rio Branco", "Cruzeiro do Sul"],
  AL: ["Maceió", "Arapiraca"],
  AP: ["Macapá", "Santana"],
  AM: ["Manaus", "Parintins"],
  BA: ["Salvador", "Feira de Santana"],
  CE: ["Fortaleza", "Juazeiro do Norte"],
  DF: ["Brasília"],
  ES: ["Vitória", "Vila Velha"],
  GO: ["Goiânia", "Anápolis"],
  MA: ["São Luís", "Imperatriz"],
  MT: ["Cuiabá", "Rondonópolis"],
  MS: ["Campo Grande", "Dourados"],
  MG: ["Belo Horizonte", "Uberlândia"],
  PA: ["Belém", "Santarém"],
  PB: ["João Pessoa", "Campina Grande"],
  PR: ["Curitiba", "Londrina"],
  PE: ["Recife", "Caruaru"],
  PI: ["Teresina", "Parnaíba"],
  RJ: ["Rio de Janeiro", "Niterói"],
  RN: ["Natal", "Mossoró"],
  RS: ["Porto Alegre", "Pelotas"],
  RO: ["Porto Velho", "Ji-Paraná"],
  RR: ["Boa Vista", "Rorainópolis"],
  SC: ["Florianópolis", "Joinville"],
  SP: ["São Paulo", "Campinas"],
  SE: ["Aracaju", "Lagarto"],
  TO: ["Palmas", "Araguaína"],
};

export const RESERVED_EMAIL_DOMAINS = ["example.com", "example.net", "example.org"] as const;
