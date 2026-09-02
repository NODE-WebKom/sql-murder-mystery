"use client";

import { sql, SQLite } from "@codemirror/lang-sql";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView, keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";

import { useMemo } from "react";

import type { SchemaTable } from "@/lib/types";

const detectiveTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "#33424a",
    backgroundColor: "transparent",
    fontSize: "13px",
  },
  ".cm-content": {
    padding: "16px 0 24px",
    caretColor: "#5e7479",
    fontFamily: "var(--hand)",
    lineHeight: "1.8",
  },
  ".cm-line": { padding: "0 18px" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#5e7479" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(94, 116, 121, 0.15)",
  },
  ".cm-gutters": {
    color: "#8e8374",
    backgroundColor: "transparent",
    border: "none",
    paddingTop: "8px",
  },
  ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.1)" },
  ".cm-activeLineGutter": { color: "#5e564b", backgroundColor: "rgba(255,255,255,0.05)" },
  ".cm-scroller": { overflow: "auto" },
  ".cm-tooltip": {
    color: "#33424a",
    border: "1px solid rgba(63,55,44,0.3)",
    backgroundColor: "rgba(255,255,255,0.9)",
    fontFamily: "var(--hand)",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    color: "#fff",
    backgroundColor: "#5e7479",
  },
}, { dark: false });

const detectiveHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#803c38", fontWeight: "600" },
  { tag: tags.string, color: "#526044" },
  { tag: tags.number, color: "#4f7481" },
  { tag: tags.bool, color: "#a34b46" },
  { tag: tags.null, color: "#a34b46" },
  { tag: tags.comment, color: "#8e8374", fontStyle: "italic" },
  { tag: tags.operator, color: "#5e564b" },
  { tag: tags.name, color: "#3f3931" },
]);

interface SqlEditorProps {
  value: string;
  schema: SchemaTable[];
  onChange: (value: string) => void;
  onRun: () => void;
}

export default function SqlEditor({ value, schema, onChange, onRun }: SqlEditorProps) {
  const completionSchema = Object.fromEntries(
    schema.map((table) => [table.name, table.columns.map((column) => column.name)]),
  );

  const extensions = useMemo(() => [
    sql({ dialect: SQLite, schema: completionSchema, upperCaseKeywords: true }),
    syntaxHighlighting(detectiveHighlight),
    Prec.highest(keymap.of([
      { key: "Mod-Enter", run: () => { onRun(); return true; } },
      { key: "Ctrl-Enter", run: () => { onRun(); return true; } },
      { key: "Cmd-Enter", run: () => { onRun(); return true; } },
    ])),
  ], [completionSchema, onRun]);

  return (
    <CodeMirror
      value={value}
      height="100%"
      onChange={onChange}
      aria-label="SQL query editor"
      basicSetup={{
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        foldGutter: false,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        lineNumbers: true,
        searchKeymap: true,
      }}
      extensions={extensions}
      theme={detectiveTheme}
    />
  );
}
