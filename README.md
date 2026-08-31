# SQL Murder Mystery Bureau

A tactile SQL investigation game built with Next.js and three local SQLite evidence databases. Players query records in a read-only CodeMirror terminal, inspect complete schemas, keep locally saved notes, reveal staged hints, and file a structured verdict.

## Run locally

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run verify:cases
npm run lint
npm run build
```

`verify:cases` runs each canonical evidence chain and asserts that every mystery has exactly one culprit.

## Architecture

- Next.js App Router pages and Node.js route handlers
- `better-sqlite3` databases opened with `readonly` and `query_only`
- CodeMirror 6 with SQLite highlighting and schema-aware completion
- Paper Shaders for procedural page fibers and surface variation
- Local storage for SQL drafts, notes, hints, verdict drafts, and solved status

Query route handlers accept only row-returning `SELECT`, `WITH`, and `EXPLAIN QUERY PLAN` statements. Output is capped at 200 rows.

## Assets

- Cork board: [Cork 003](https://ambientcg.com/a/Cork003) from ambientCG, CC0 1.0.
- Desk: [Wood 051](https://ambientcg.com/a/Wood051) from ambientCG, CC0 1.0.
- Procedural paper texture: [Paper Shaders](https://github.com/paper-design/shaders), Apache-2.0.
