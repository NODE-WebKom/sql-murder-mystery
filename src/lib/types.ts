export type CaseSlug =
  | "the-last-espresso"
  | "the-blackthorn-ledger"
  | "midnight-at-pier-nine"
  | "manor"
  | "nordkapp-fjord"
  | "the-bellweather-murder"
  | "thesis"
  | "midnight-library"
  | "deed-and-probate"
  | "coffee"
  | "lighthouse-keepers-demise";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface CaseFact {
  label: string;
  value: string;
}

export interface CaseDefinition {
  slug: CaseSlug;
  caseNumber: string;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  boardNote: string;
  date: string;
  location: string;
  victim: string;
  accent: string;
  accentDark: string;
  brief: string[];
  facts: CaseFact[];
  statements: string[];
  objective: string;
  skills: string[];
  hints: string[];
  starterSql: string;
}

export interface SchemaColumn {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
  defaultValue: string | null;
}

export interface SchemaForeignKey {
  from: string;
  targetTable: string;
  targetColumn: string;
}

export interface SchemaTable {
  name: string;
  sql: string;
  rowCount: number;
  columns: SchemaColumn[];
  foreignKeys: SchemaForeignKey[];
}

export interface QuerySuccess {
  ok: true;
  columns: string[];
  rows: Record<string, string | number | null>[];
  rowCount: number;
  truncated: boolean;
  elapsedMs: number;
}

export interface QueryFailure {
  ok: false;
  error: string;
}

export type QueryResult = QuerySuccess | QueryFailure;

export interface VerdictPayload {
  culprit: string;
}

export interface VerdictResult {
  solved: boolean;
  message: string;
  reconstruction?: string;
}
