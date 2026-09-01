"use client";

import {
  ArrowLeft,
  ChevronRight,
  CornerUpLeft,
  CircleAlert,
  FileText,
  Gavel,
  KeyRound,
  Lightbulb,
  Play,
  RotateCcw,
  Search,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { PaperTexture } from "@paper-design/shaders-react";

import type {
  CaseDefinition,
  QueryResult,
  SchemaTable,
  VerdictPayload,
  VerdictResult,
} from "@/lib/types";

import styles from "./case-notebook.module.css";

const SqlEditor = dynamic(() => import("./sql-editor"), {
  ssr: false,
  loading: () => <div className={styles.editorLoading}>Opening evidence terminal...</div>,
});

interface CaseNotebookProps {
  mystery: CaseDefinition;
  schema: SchemaTable[];
}

type SectionId = "sql" | "schema" | "brief" | "notes" | "accuse";
type PageSide = "left" | "right";

interface SectionDefinition {
  id: SectionId;
  label: string;
  color: string;
  dark: string;
  kicker: string;
  title: string;
}

const SECTIONS: SectionDefinition[] = [
  {
    id: "sql",
    label: "SQL",
    color: "#d3a343",
    dark: "#6a4c17",
    kicker: "Evidence terminal",
    title: "Interrogate the records",
  },
  {
    id: "schema",
    label: "Schema",
    color: "#6f9daf",
    dark: "#315361",
    kicker: "Evidence catalog",
    title: "Database schema",
  },
  {
    id: "brief",
    label: "Brief",
    color: "#8d7196",
    dark: "#4b3a52",
    kicker: "Case file",
    title: "Case brief",
  },
  {
    id: "notes",
    label: "Notes",
    color: "#81986a",
    dark: "#405136",
    kicker: "Private working file",
    title: "Investigation notes",
  },
  {
    id: "accuse",
    label: "Accuse",
    color: "#a34b46",
    dark: "#592522",
    kicker: "Municipal Investigation Unit",
    title: "Name the killer",
  },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);
const DEFAULT_PAGES: [SectionId, SectionId] = ["sql", "brief"];

/** Only the SQL page splits into folds; every other section is a single block. */
type FoldId = "sql-query" | "sql-results";

const DEFAULT_FOLDS: Record<FoldId, boolean> = {
  "sql-query": true,
  "sql-results": true,
};

function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && SECTION_IDS.includes(value as SectionId);
}

function getSection(id: SectionId): SectionDefinition {
  return SECTIONS.find((section) => section.id === id) ?? SECTIONS[0];
}

/** The desk is too narrow for a two-page spread below this width. */
const NARROW_QUERY = "(max-width: 880px)";

function subscribeToNarrow(onChange: () => void) {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsNarrow() {
  return useSyncExternalStore(
    subscribeToNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}

function PaperPage({
  side,
  seed,
  section,
  corner,
  children,
}: {
  side: PageSide;
  seed: number;
  section: SectionDefinition;
  corner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className={`${styles.paperPage} ${styles[side]}`}>
      <PaperTexture
        className={styles.paperShader}
        width="100%"
        height="100%"
        colorFront="#eee6d3"
        colorBack="#c9bca5"
        contrast={0.22}
        roughness={0.42}
        fiber={0.22}
        fiberSize={0.28}
        crumples={0.08}
        crumpleSize={0.7}
        folds={0.04}
        foldCount={3}
        drops={0.08}
        seed={seed}
        maxPixelCount={320_000}
        aria-hidden="true"
      />
      <div className={styles.paperNoise} aria-hidden="true" />
      <div
        className={styles.pageInner}
        id={`page-${side}`}
        role="tabpanel"
        aria-labelledby={`bookmark-${side}-${section.id}`}
        style={{ "--page-color": section.color, "--page-dark": section.dark } as React.CSSProperties}
      >
        {children}
      </div>
      {corner}
    </article>
  );
}

/**
 * A folded page corner in the outer bottom corner of the page, the way a
 * digital book offers a page to turn. Closing the case turns you back out to
 * the board.
 */
function PageTurnCorner({ side }: { side: PageSide }) {
  return (
    <Link
      href="/"
      className={`${styles.pageTurn} ${styles[`turn_${side}`]}`}
      aria-label="Return to the case board"
    >
      <span className={styles.pageTurnFold} aria-hidden="true" />
      <span className={styles.pageTurnLabel}>
        <CornerUpLeft size={19} strokeWidth={1.8} aria-hidden="true" />
        Case board
      </span>
    </Link>
  );
}

function PageHeading({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <header className={styles.pageHeading}>
      <span>{kicker}</span>
      <h2>{children}</h2>
    </header>
  );
}

/**
 * One half of a section, stacked on a single page.
 *
 * A plain button + panel rather than <details>: the folds have to divide a
 * fixed page height between them, and a <details>'s content lives inside the
 * UA's ::details-content wrapper, which swallows the flex sizing. The panel
 * stays mounted while collapsed so the editor keeps its state.
 */
function PageFold({
  id,
  label,
  open,
  grow,
  onToggle,
  children,
}: {
  id: FoldId;
  label: string;
  open: boolean;
  grow?: boolean;
  onToggle: (id: FoldId, open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className={`${styles.pageFold} ${grow ? styles.foldGrow : ""}`} data-open={open}>
      <button
        type="button"
        className={styles.foldSummary}
        aria-expanded={open}
        aria-controls={`fold-${id}`}
        onClick={() => onToggle(id, !open)}
      >
        <ChevronRight size={13} strokeWidth={2.2} aria-hidden="true" />
        <span>{label}</span>
      </button>
      <div className={styles.foldBody} id={`fold-${id}`} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

/**
 * The bookmarks poking out of the top of one page. Every section is listed on
 * every rail; the section this page is turned to is raised and highlighted, and
 * the section held open on the other page is marked so you can see where it went.
 */
function BookmarkRail({
  side,
  current,
  other,
  onTurn,
}: {
  side: PageSide;
  current: SectionId;
  other: SectionId;
  onTurn: (side: PageSide, id: SectionId) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    // The right rail runs in reverse, so its arrow keys must run in reverse too.
    const direction = side === "right" ? -step : step;
    const next = (index + direction + SECTIONS.length) % SECTIONS.length;
    buttons.current[next]?.focus();
  }

  return (
    <div
      className={`${styles.bookmarkRail} ${styles[`rail_${side}`]}`}
      role="tablist"
      aria-label={`${side === "left" ? "Left" : "Right"} page section`}
    >
      {SECTIONS.map((section, index) => {
        const active = section.id === current;
        const elsewhere = section.id === other;
        return (
          <button
            key={section.id}
            type="button"
            id={`bookmark-${side}-${section.id}`}
            ref={(element) => { buttons.current[index] = element; }}
            role="tab"
            aria-selected={active}
            aria-controls={`page-${side}`}
            tabIndex={active ? 0 : -1}
            className={`${styles.bookmark} ${active ? styles.bookmarkActive : ""} ${elsewhere ? styles.bookmarkElsewhere : ""}`}
            style={{ "--tab-color": section.color, "--tab-dark": section.dark } as React.CSSProperties}
            // Nothing marks a parked section visually beyond its dimming, so
            // spell the swap out for screen readers.
            aria-label={
              elsewhere
                ? `${section.label} — open on the ${side === "left" ? "right" : "left"} page; selecting it swaps the pages`
                : undefined
            }
            onClick={() => onTurn(side, section.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );
}

function ResultTable({ result }: { result: Extract<QueryResult, { ok: true }> }) {
  return (
    <div className={styles.resultScroller}>
      <table className={styles.resultTable}>
        <thead>
          <tr>
            <th aria-label="Row number">#</th>
            {result.columns.map((column, index) => (
              <th key={`${column}-${index}`}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th>{rowIndex + 1}</th>
              {result.columns.map((column, columnIndex) => (
                <td key={`${column}-${columnIndex}`}>
                  {row[column] === null ? <i>NULL</i> : String(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CaseNotebook({ mystery, schema }: CaseNotebookProps) {
  const [pages, setPages] = useState<[SectionId, SectionId]>(DEFAULT_PAGES);
  const [folds, setFolds] = useState<Record<FoldId, boolean>>(DEFAULT_FOLDS);
  const [sqlText, setSqlText] = useState(mystery.starterSql);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [revealedHints, setRevealedHints] = useState(0);
  const [accused, setAccused] = useState("");
  const [verdictResult, setVerdictResult] = useState<VerdictResult | null>(null);
  const [verdictRunning, setVerdictRunning] = useState(false);
  const [schemaSearch, setSchemaSearch] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const deferredSchemaSearch = useDeferredValue(schemaSearch);
  const queryRun = useRef(0);
  const isNarrow = useIsNarrow();

  const filteredSchema = schema.filter((table) => {
    const query = deferredSchemaSearch.trim().toLocaleLowerCase("en");
    return (
      !query ||
      table.name.toLocaleLowerCase("en").includes(query) ||
      table.columns.some((column) => column.name.toLocaleLowerCase("en").includes(query))
    );
  });

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const key = (field: string) => `sqlmm:${mystery.slug}:${field}`;
      const savedSql = localStorage.getItem(key("sql"));
      const savedNotes = localStorage.getItem(key("notes"));
      const savedHints = Number(localStorage.getItem(key("hints")) ?? 0);
      const savedVerdict = localStorage.getItem(key("verdict"));
      const savedPages = localStorage.getItem(key("pages"));
      const savedFolds = localStorage.getItem(key("folds"));

      if (savedSql) setSqlText(savedSql);
      if (savedNotes) setNotes(savedNotes);
      if (Number.isInteger(savedHints)) {
        setRevealedHints(Math.min(Math.max(savedHints, 0), mystery.hints.length));
      }
      let savedName = "";
      if (savedVerdict) {
        try {
          // Older saves held method/motive/narrative too; only the name survives.
          const parsed = JSON.parse(savedVerdict);
          if (typeof parsed?.culprit === "string") {
            savedName = parsed.culprit;
            setAccused(savedName);
          }
        } catch {
          localStorage.removeItem(key("verdict"));
        }
      }

      // A closed case keeps its verdict panel and page-turn corner across
      // reloads. The reconstruction is server-authored prose, so ask for it
      // again rather than caching a copy that could go stale.
      if (localStorage.getItem(key("solved")) === "true" && savedName.trim()) {
        fetch(`/api/cases/${mystery.slug}/verdict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ culprit: savedName } satisfies VerdictPayload),
        })
          .then((response) => response.json() as Promise<VerdictResult>)
          .then((result) => {
            if (!cancelled && result.solved) setVerdictResult(result);
          })
          .catch(() => {
            // Offline or the route is down: the case simply reads as open.
          });
      }

      let restored = false;
      if (savedPages) {
        try {
          const parsed = JSON.parse(savedPages);
          if (Array.isArray(parsed) && isSectionId(parsed[0]) && isSectionId(parsed[1]) && parsed[0] !== parsed[1]) {
            setPages([parsed[0], parsed[1]]);
            restored = true;
          }
        } catch {
          localStorage.removeItem(key("pages"));
        }
      }
      if (!restored) {
        // Before split screen a single tab index drove both pages.
        const legacyTab = Number(localStorage.getItem(key("tab")) ?? NaN);
        const legacy = SECTIONS[legacyTab]?.id;
        if (legacy) {
          setPages([legacy, legacy === DEFAULT_PAGES[1] ? DEFAULT_PAGES[0] : DEFAULT_PAGES[1]]);
        }
      }

      if (savedFolds) {
        try {
          const parsed = JSON.parse(savedFolds);
          setFolds((current) => {
            const next = { ...current };
            for (const id of Object.keys(current) as FoldId[]) {
              if (typeof parsed?.[id] === "boolean") next[id] = parsed[id];
            }
            return next;
          });
        } catch {
          localStorage.removeItem(key("folds"));
        }
      }

      setStorageReady(true);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mystery.hints.length, mystery.slug]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(`sqlmm:${mystery.slug}:sql`, sqlText);
  }, [mystery.slug, sqlText, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(`sqlmm:${mystery.slug}:notes`, notes);
  }, [mystery.slug, notes, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(`sqlmm:${mystery.slug}:hints`, String(revealedHints));
  }, [mystery.slug, revealedHints, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(`sqlmm:${mystery.slug}:verdict`, JSON.stringify({ culprit: accused }));
  }, [accused, mystery.slug, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(`sqlmm:${mystery.slug}:pages`, JSON.stringify(pages));
  }, [mystery.slug, pages, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(`sqlmm:${mystery.slug}:folds`, JSON.stringify(folds));
  }, [mystery.slug, folds, storageReady]);

  /**
   * Turn one page to a section. Picking the section already open on the other
   * page swaps the two pages instead of showing it twice.
   */
  const turnPage = useCallback((side: PageSide, id: SectionId) => {
    startTransition(() => {
      setPages(([left, right]) => {
        if (side === "left") {
          if (id === left) return [left, right];
          return id === right ? [right, left] : [id, right];
        }
        if (id === right) return [left, right];
        return id === left ? [right, left] : [left, id];
      });
    });
  }, []);

  const toggleFold = useCallback((id: FoldId, open: boolean) => {
    setFolds((current) => (current[id] === open ? current : { ...current, [id]: open }));
  }, []);

  async function runQuery() {
    const currentRun = ++queryRun.current;
    setQueryRunning(true);

    try {
      const response = await fetch(`/api/cases/${mystery.slug}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: sqlText }),
      });
      const result = (await response.json()) as QueryResult;
      if (currentRun === queryRun.current) setQueryResult(result);
    } catch {
      if (currentRun === queryRun.current) {
        setQueryResult({ ok: false, error: "The evidence terminal could not be reached." });
      }
    } finally {
      if (currentRun === queryRun.current) setQueryRunning(false);
    }
  }

  function resetSql() {
    setSqlText(mystery.starterSql);
    setQueryResult(null);
  }

  async function submitAccusation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerdictRunning(true);

    try {
      const response = await fetch(`/api/cases/${mystery.slug}/verdict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ culprit: accused } satisfies VerdictPayload),
      });
      const result = (await response.json()) as VerdictResult;
      setVerdictResult(result);
      if (result.solved) {
        localStorage.setItem(`sqlmm:${mystery.slug}:solved`, "true");
      }
    } catch {
      setVerdictResult({
        solved: false,
        message: "The accusation could not be filed. Try again.",
      });
    } finally {
      setVerdictRunning(false);
    }
  }

  function renderSqlPage() {
    return (
      <>
        <PageFold id="sql-query" label="Query" open={folds["sql-query"]} grow onToggle={toggleFold}>
          <div className={styles.queryBrief}>
            <span><KeyRound size={12} /> Ctrl/⌘ + Enter to run</span>
          </div>
          <div className={styles.editorShell}>
            <div className={styles.editorBody}>
              <SqlEditor
                value={sqlText}
                schema={schema}
                onChange={setSqlText}
                onRun={runQuery}
              />
            </div>
          </div>
          <div className={styles.queryActions}>
            <button type="button" className={styles.textButton} onClick={resetSql}>
              <RotateCcw size={14} /> Reset
            </button>
            <button
              type="button"
              className={styles.runButton}
              onClick={runQuery}
              disabled={queryRunning}
            >
              <Play size={15} fill="currentColor" />
              {queryRunning ? "Running..." : "Run query"}
            </button>
          </div>
        </PageFold>

        <PageFold id="sql-results" label="Results" open={folds["sql-results"]} grow onToggle={toggleFold}>
          <div className={styles.resultStatus} aria-live="polite">
            {queryRunning ? (
              <span className={styles.statusWorking}>Searching records...</span>
            ) : queryResult?.ok ? (
              <>
                <span className={styles.statusGood}>{queryResult.rowCount} rows returned</span>
                <span>{queryResult.elapsedMs.toFixed(1)} ms</span>
              </>
            ) : queryResult ? (
              <span className={styles.statusBad}>Query stopped</span>
            ) : (
              <span>No query run yet</span>
            )}
          </div>
          <div className={styles.resultSheet}>
            {!queryResult && (
              <div className={styles.emptyResult}>
                <Search size={30} strokeWidth={1.25} />
                <h3>The records are waiting</h3>
                <p>Run a query above. Results are logged here without altering the evidence.</p>
                <code>SELECT * FROM {schema[0]?.name} LIMIT 10;</code>
              </div>
            )}
            {queryResult && !queryResult.ok && (
              <div className={styles.queryError} role="alert">
                <CircleAlert size={23} />
                <div>
                  <b>SQLite reports</b>
                  <p>{queryResult.error}</p>
                </div>
              </div>
            )}
            {queryResult?.ok && queryResult.rows.length === 0 && (
              <div className={styles.emptyResult}>
                <FileText size={28} strokeWidth={1.3} />
                <h3>No matching records</h3>
                <p>The query ran successfully but returned no rows. Check names, values, and time boundaries.</p>
              </div>
            )}
            {queryResult?.ok && queryResult.rows.length > 0 && <ResultTable result={queryResult} />}
          </div>
          {queryResult?.ok && queryResult.truncated && (
            <p className={styles.truncatedNote}>Display stopped at 200 rows. Refine the query to narrow the evidence.</p>
          )}
        </PageFold>
      </>
    );
  }

  function renderSchemaPage() {
    return (
      <>
        <label className={styles.schemaSearch}>
          <Search size={15} aria-hidden="true" />
          <span className={styles.srOnly}>Filter tables or columns</span>
          <input
            type="search"
            value={schemaSearch}
            onChange={(event) => setSchemaSearch(event.target.value)}
            placeholder="Filter tables or columns..."
          />
        </label>
        <p className={styles.schemaIntro}>{schema.length} tables in this evidence file. Query them from the SQL page &mdash; the truth is in the rows.</p>

        <div className={styles.schemaGrid}>
          {filteredSchema.map((table) => (
            <div key={table.name} className={styles.schemaCard}>
              <div className={styles.schemaCardHeader}>
                <span className={styles.schemaTableName}>{table.name}</span>
                <span className={styles.schemaRowCount}>{table.rowCount} row{table.rowCount === 1 ? "" : "s"}</span>
              </div>
              <table className={styles.schemaTable}>
                <thead>
                  <tr>
                    <th>column</th>
                    <th>type</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col) => {
                    const foreignKey = table.foreignKeys.find((fk) => fk.from === col.name);
                    return (
                      <tr key={col.name}>
                        <td>
                          <span className={styles.schemaColName}>{col.name}</span>
                          {col.primaryKey && <b className={styles.schemaKeyTag}>PK</b>}
                        </td>
                        <td>
                          <span className={styles.schemaColType}>{col.type || "—"}</span>
                          {foreignKey && (
                            <span className={styles.schemaFk}>
                              &rarr; {foreignKey.targetTable}.{foreignKey.targetColumn}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <details className={styles.schemaDdl}>
                <summary>CREATE TABLE</summary>
                <pre>{table.sql}</pre>
              </details>
            </div>
          ))}
          {filteredSchema.length === 0 && (
            <p className={styles.noTables}>No table or column matches &quot;{deferredSchemaSearch}&quot;.</p>
          )}
        </div>
      </>
    );
  }

  function renderBriefPage() {
    return (
      <div className={styles.briefScroll}>
        <div className={styles.briefBlock}>
          <div className={styles.briefClip} aria-hidden="true" />
          <header className={styles.briefHeader}>
            <span>Confidential // {mystery.caseNumber}</span>
            <h2>{mystery.title}</h2>
          </header>
          <dl className={styles.briefMeta}>
            <div><dt>Victim</dt><dd>{mystery.victim}</dd></div>
            <div><dt>Scene</dt><dd>{mystery.location}</dd></div>
            <div><dt>Filed</dt><dd>{mystery.date}</dd></div>
          </dl>
          <div className={styles.briefCopy}>
            {mystery.brief.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <div className={styles.factGrid}>
            {mystery.facts.map((fact) => (
              <div key={fact.label}><span>{fact.label}</span><b>{fact.value}</b></div>
            ))}
          </div>
          <section className={styles.objective}>
            <h3>Your objective</h3>
            <p>{mystery.objective}</p>
          </section>
        </div>

        <section className={styles.statements}>
          <h3>Statements on file</h3>
          {mystery.statements.map((statement) => <p key={statement}>{statement}</p>)}
        </section>

        <section className={styles.hints}>
          <div className={styles.hintsHeading}>
            <span><Lightbulb size={16} /> Leads</span>
            <small>{revealedHints}/{mystery.hints.length} opened</small>
          </div>
          {mystery.hints.slice(0, revealedHints).map((hint, index) => (
            <div className={styles.hintCard} key={hint}>
              <b>Lead {index + 1}</b>
              <p>{hint}</p>
            </div>
          ))}
          {revealedHints < mystery.hints.length && (
            <button
              type="button"
              className={styles.revealHint}
              onClick={() => setRevealedHints((count) => count + 1)}
            >
              Reveal lead {revealedHints + 1}
            </button>
          )}
        </section>
      </div>
    );
  }

  function renderNotesPage() {
    return (
      <label className={styles.notesField}>
        <span className={styles.srOnly}>Investigation notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={"Write names, joins, contradictions, and theories here...\n\nYour notes save automatically on this device."}
        />
      </label>
    );
  }

  function renderAccusePage() {
    // A closed case is settled: the name stays readable but the form is inert.
    const closed = verdictResult?.solved === true;

    return (
      <div className={styles.accuse}>
        <p className={styles.accuseIntro}>
          One name. Make it the one the records cannot explain away.
        </p>
        <form className={styles.accuseForm} onSubmit={submitAccusation}>
          <label>
            <span>Who killed {mystery.victim.split(",")[0]}?</span>
            <input
              required
              readOnly={closed}
              value={accused}
              onChange={(event) => {
                setAccused(event.target.value);
                setVerdictResult(null);
              }}
              placeholder="Full name or known alias"
              autoComplete="off"
            />
          </label>
          <button
            className={styles.signOff}
            type="submit"
            disabled={verdictRunning || closed || !accused.trim()}
          >
            <Gavel size={15} /> {verdictRunning ? "Checking evidence..." : closed ? "Case closed" : "Accuse"}
          </button>
        </form>
        {verdictResult && (
          <div
            className={`${styles.verdictResponse} ${verdictResult.solved ? styles.caseClosed : styles.caseOpen}`}
            role="status"
          >
            <b>{verdictResult.solved ? "Case closed" : "Not your killer"}</b>
            {/* When solved the reconstruction says it better; the message only
                earns its place as feedback on a wrong name. */}
            {!verdictResult.solved && <p>{verdictResult.message}</p>}
            {verdictResult.reconstruction && <p>{verdictResult.reconstruction}</p>}
          </div>
        )}
      </div>
    );
  }

  const PAGE_RENDERERS: Record<SectionId, () => ReactNode> = {
    sql: renderSqlPage,
    schema: renderSchemaPage,
    brief: renderBriefPage,
    notes: renderNotesPage,
    accuse: renderAccusePage,
  };

  function renderPage(side: PageSide) {
    const id = pages[side === "left" ? 0 : 1];
    const section = getSection(id);
    const closed = id === "accuse" && verdictResult?.solved;
    return (
      <PaperPage
        side={side}
        seed={side === "left" ? 17 : 34}
        section={section}
        corner={closed ? <PageTurnCorner side={side} /> : undefined}
      >
        <PageHeading kicker={section.kicker}>{section.title}</PageHeading>
        {PAGE_RENDERERS[id]()}
      </PaperPage>
    );
  }

  return (
    <main
      className={styles.deskScene}
      style={
        {
          "--case-accent": mystery.accent,
          "--case-accent-dark": mystery.accentDark,
        } as React.CSSProperties
      }
    >
      <div className={styles.deskVignette} aria-hidden="true" />
      <div className={styles.coffeeRing} aria-hidden="true" />
      <div className={styles.pencil} aria-hidden="true" />

      <header className={styles.caseHeader}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Case board
        </Link>
        <div className={styles.caseIdentity}>
          <span>{mystery.caseNumber} · {mystery.difficulty}</span>
          <h1>{mystery.title}</h1>
          <p>{mystery.subtitle}</p>
        </div>
      </header>

      <section className={styles.notebookStage} aria-label={`${mystery.title} case notebook`}>
        <div className={styles.spreadShell}>
          {!isNarrow && (
            <>
              <BookmarkRail side="left" current={pages[0]} other={pages[1]} onTurn={turnPage} />
              <BookmarkRail side="right" current={pages[1]} other={pages[0]} onTurn={turnPage} />
            </>
          )}

          <div className={styles.spread}>
            {renderPage("left")}
            {!isNarrow && renderPage("right")}
          </div>

          {!isNarrow && (
            <div className={styles.binding} aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
            </div>
          )}
        </div>

        {isNarrow && (
          <nav className={styles.mobileTabs} aria-label="Notebook sections">
            {SECTIONS.map((section) => {
              const active = section.id === pages[0];
              return (
                <button
                  type="button"
                  key={section.id}
                  onClick={() => turnPage("left", section.id)}
                  className={active ? styles.mobileActive : ""}
                  style={{ "--tab-color": section.color } as React.CSSProperties}
                  aria-current={active ? "page" : undefined}
                >
                  {section.label}
                </button>
              );
            })}
          </nav>
        )}
      </section>
    </main>
  );
}
