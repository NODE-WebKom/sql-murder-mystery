"use client";

import { useMemo, type CSSProperties } from "react";

/**
 * Minimal SQLite highlighter using the exact detective palette from the
 * evidence terminal (see sql-editor.tsx): keywords #803c38 bold, strings
 * #526044, numbers #4f7481, comments #8e8374 italic, operators #5e564b,
 * names #3f3931. Rendered in the same typewriter font via .code.
 */

const KEYWORDS = [
  "SELECT", "DISTINCT", "AS", "FROM", "WHERE", "AND", "OR", "NOT", "IN",
  "BETWEEN", "LIKE", "IS", "NULL", "JOIN", "LEFT", "INNER", "OUTER", "ON",
  "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC", "LIMIT", "COUNT",
  "EXPLAIN", "QUERY", "PLAN", "WITH", "UNION", "ALL", "CASE", "WHEN",
  "THEN", "ELSE", "END", "EXISTS", "GLOB",
].join("|");

const TOKEN_PATTERN = new RegExp(
  [
    "(?<comment>--[^\\n]*)",
    "(?<string>'(?:[^']|'')*')",
    "(?<number>\\b\\d+(?:\\.\\d+)?\\b)",
    `(?<keyword>\\b(?:${KEYWORDS})\\b)`,
    "(?<identifier>[A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)*)",
    "(?<operator><>|!=|>=|<=|=|<|>|\\+|-|\\*|/|%)",
  ].join("|"),
  "gi",
);

type Scope = "comment" | "string" | "number" | "keyword" | "identifier" | "operator" | "plain";

const STYLE: Record<Scope, CSSProperties> = {
  keyword: { color: "#803c38", fontWeight: 600 },
  string: { color: "#526044" },
  number: { color: "#4f7481" },
  comment: { color: "#8e8374", fontStyle: "italic" },
  identifier: { color: "#3f3931" },
  operator: { color: "#5e564b" },
  plain: {},
};

interface Token {
  text: string;
  scope: Scope;
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  TOKEN_PATTERN.lastIndex = 0;
  for (let match = TOKEN_PATTERN.exec(code); match !== null; match = TOKEN_PATTERN.exec(code)) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), scope: "plain" });
    }
    const groups = match.groups ?? {};
    const scope = (Object.keys(STYLE) as Scope[]).find(
      (key) => key !== "plain" && groups[key] !== undefined,
    ) ?? "plain";
    tokens.push({ text: match[0], scope });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), scope: "plain" });
  }
  return tokens;
}

export function SqlCode({ code }: { code: string }) {
  const tokens = useMemo(() => tokenize(code), [code]);
  return (
    <code>
      {tokens.map((token, index) => (
        <span key={`${index}-${token.text}`} style={STYLE[token.scope]}>
          {token.text}
        </span>
      ))}
    </code>
  );
}
