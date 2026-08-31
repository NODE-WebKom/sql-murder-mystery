import "server-only";

import Database from "better-sqlite3";
import { join } from "node:path";

import type {
  CaseSlug,
  QueryResult,
  SchemaColumn,
  SchemaForeignKey,
  SchemaTable,
} from "@/lib/types";

const MAX_QUERY_LENGTH = 12_000;
const MAX_RESULT_ROWS = 200;

function databasePath(slug: CaseSlug): string {
  return join(process.cwd(), "data", "cases", `${slug}.db`);
}

function openDatabase(slug: CaseSlug): Database.Database {
  const database = new Database(databasePath(slug), {
    readonly: true,
    fileMustExist: true,
    timeout: 1_000,
  });
  database.pragma("foreign_keys = ON");
  database.pragma("query_only = ON");
  return database;
}

function stripLeadingComments(sql: string): string {
  let remaining = sql.trimStart();

  while (remaining.startsWith("--") || remaining.startsWith("/*")) {
    if (remaining.startsWith("--")) {
      const lineEnd = remaining.indexOf("\n");
      remaining = lineEnd === -1 ? "" : remaining.slice(lineEnd + 1).trimStart();
      continue;
    }

    const commentEnd = remaining.indexOf("*/");
    if (commentEnd === -1) return "";
    remaining = remaining.slice(commentEnd + 2).trimStart();
  }

  return remaining;
}

function validateSql(sql: string): string | null {
  if (!sql.trim()) return "Write a query before running it.";
  if (sql.length > MAX_QUERY_LENGTH) {
    return `Queries are limited to ${MAX_QUERY_LENGTH.toLocaleString()} characters.`;
  }

  const statement = stripLeadingComments(sql);
  if (!/^(select\b|with\b|explain\s+query\s+plan\b)/i.test(statement)) {
    return "Evidence files are read-only. Use SELECT, WITH, or EXPLAIN QUERY PLAN.";
  }

  const withoutComments = sql
    .replace(/--.*$/gm, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
  if (/\b(attach|detach|vacuum|pragma|reindex|analyze|load_extension)\b/i.test(withoutComments)) {
    return "That operation is not available in the evidence reader.";
  }

  return null;
}

function serializeValue(value: unknown): string | number | null {
  if (value === null || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (Buffer.isBuffer(value)) return `0x${value.toString("hex")}`;
  return String(value);
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function getCaseSchema(slug: CaseSlug): SchemaTable[] {
  const database = openDatabase(slug);

  try {
    const tables = database
      .prepare(
        `SELECT name, sql
         FROM sqlite_schema
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      )
      .all() as { name: string; sql: string }[];

    const columnStatement = database.prepare(
      `SELECT name, type, "notnull" AS not_null, dflt_value, pk
       FROM pragma_table_info(?)
       ORDER BY cid`,
    );
    const foreignKeyStatement = database.prepare(
      `SELECT "from" AS source_column, "table" AS target_table,
              "to" AS target_column
       FROM pragma_foreign_key_list(?)
       ORDER BY id, seq`,
    );

    return tables.map((table) => {
      const columns = columnStatement.all(table.name) as {
        name: string;
        type: string;
        not_null: number;
        dflt_value: string | null;
        pk: number;
      }[];
      const foreignKeys = foreignKeyStatement.all(table.name) as {
        source_column: string;
        target_table: string;
        target_column: string;
      }[];
      const count = database
        .prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table.name)}`)
        .get() as { count: number };

      return {
        name: table.name,
        sql: table.sql,
        rowCount: count.count,
        columns: columns.map(
          (column): SchemaColumn => ({
            name: column.name,
            type: column.type || "ANY",
            notNull: Boolean(column.not_null),
            primaryKey: Boolean(column.pk),
            defaultValue: column.dflt_value,
          }),
        ),
        foreignKeys: foreignKeys.map(
          (foreignKey): SchemaForeignKey => ({
            from: foreignKey.source_column,
            targetTable: foreignKey.target_table,
            targetColumn: foreignKey.target_column,
          }),
        ),
      };
    });
  } finally {
    database.close();
  }
}

export function getCaseTableRows(
  slug: CaseSlug,
  tableName: string,
  limit: number = 15,
): { columns: string[]; rows: Record<string, string | number | null>[] } {
  const database = openDatabase(slug);

  try {
    const statement = database.prepare(
      `SELECT * FROM ${quoteIdentifier(tableName)} LIMIT ${limit}`,
    );
    const seenColumns = new Map<string, number>();
    const columns = statement.columns().map((column) => {
      const count = (seenColumns.get(column.name) ?? 0) + 1;
      seenColumns.set(column.name, count);
      return count === 1 ? column.name : `${column.name}_${count}`;
    });
    const rows: Record<string, string | number | null>[] = [];

    for (const rawRow of statement.raw(true).iterate() as Iterable<unknown[]>) {
      rows.push(
        Object.fromEntries(
          columns.map((column, index) => [column, serializeValue(rawRow[index])]),
        ),
      );
    }

    return { columns, rows };
  } finally {
    database.close();
  }
}

export function executeCaseQuery(slug: CaseSlug, sql: string): QueryResult {
  const validationError = validateSql(sql);
  if (validationError) return { ok: false, error: validationError };

  const database = openDatabase(slug);
  const startedAt = performance.now();

  try {
    const statement = database.prepare(sql);
    if (!statement.readonly || !statement.reader) {
      return {
        ok: false,
        error: "The evidence reader only accepts read-only queries that return rows.",
      };
    }

    const seenColumns = new Map<string, number>();
    const columns = statement.columns().map((column) => {
      const count = (seenColumns.get(column.name) ?? 0) + 1;
      seenColumns.set(column.name, count);
      return count === 1 ? column.name : `${column.name}_${count}`;
    });
    const rows: Record<string, string | number | null>[] = [];
    let truncated = false;

    for (const rawRow of statement.raw(true).iterate() as Iterable<unknown[]>) {
      if (rows.length === MAX_RESULT_ROWS) {
        truncated = true;
        break;
      }

      rows.push(
        Object.fromEntries(
          columns.map((column, index) => [column, serializeValue(rawRow[index])]),
        ),
      );
    }

    return {
      ok: true,
      columns,
      rows,
      rowCount: rows.length,
      truncated,
      elapsedMs: Math.max(0.1, performance.now() - startedAt),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "The query could not be run.",
    };
  } finally {
    database.close();
  }
}
