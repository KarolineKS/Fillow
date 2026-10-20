import { Result } from "../shared/result";
import type { DomainError } from "../shared/domain-error";
import type { TestPayload } from "./test-payload";

/** Boundary and hostile-but-harmless inputs: no destructive SQL, no dialogs (AC 33). */
const CATALOG: readonly TestPayload[] = [
  {
    kind: "fuzz",
    fieldType: "text",
    value: "A".repeat(501),
    reasonCode: "FUZZ_LONG_STRING",
    explanation: "501 characters. Without maxlength or a server limit, long input breaks layouts or overflows database columns.",
  },
  {
    kind: "fuzz",
    fieldType: "text",
    value: "",
    reasonCode: "FUZZ_EMPTY",
    explanation: "An empty value. Required fields must say so instead of submitting nothing.",
  },
  {
    kind: "fuzz",
    fieldType: "text",
    value: "     ",
    reasonCode: "FUZZ_WHITESPACE_ONLY",
    explanation: "Only spaces. It looks filled in, so a required check that does not trim lets a blank value through.",
  },
  {
    kind: "fuzz",
    fieldType: "text",
    value: "Ana 😀👍🏽🇧🇷",
    reasonCode: "FUZZ_EMOJI",
    explanation: "Emoji take several bytes each. Systems that are not UTF-8 end to end store them as question marks or crash.",
  },
  {
    kind: "fuzz",
    fieldType: "text",
    value: "‮avlis anA مرحبا",
    reasonCode: "FUZZ_RTL_OVERRIDE",
    explanation: "A right-to-left override character flips how the text is displayed, which can disguise what was really typed.",
  },
  {
    kind: "fuzz",
    fieldType: "number",
    value: "-1",
    reasonCode: "FUZZ_NEGATIVE_NUMBER",
    explanation: "A negative number. Quantities, ages and prices usually need a min attribute to refuse it.",
  },
  {
    kind: "fuzz",
    fieldType: "number",
    value: "0",
    reasonCode: "FUZZ_ZERO",
    explanation: "Zero sits on the boundary: it is often falsy in JavaScript and can be treated as \"not filled\".",
  },
  {
    kind: "fuzz",
    fieldType: "number",
    value: "99999999999999999999",
    reasonCode: "FUZZ_HUGE_NUMBER",
    explanation: "20 digits exceed what a JavaScript number holds exactly, so the saved value silently changes.",
  },
  {
    kind: "fuzz",
    fieldType: "text",
    value: "<script>console.log(\"fillow-xss-probe\")</script>",
    reasonCode: "FUZZ_XSS_PROBE",
    explanation: "A harmless script tag. If this text later runs instead of being shown, the page is open to cross-site scripting.",
  },
  {
    kind: "fuzz",
    fieldType: "text",
    value: "' OR '1'='1' --",
    reasonCode: "FUZZ_SQLI_PROBE",
    explanation: "A read-only SQL injection probe. If it changes what the server returns, queries are built by string concatenation.",
  },
];

export const FuzzingCatalogService = {
  catalog(): Result<TestPayload[], DomainError> {
    return Result.ok([...CATALOG]);
  },
} as const;
