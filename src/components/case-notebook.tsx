"use client";

import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Database,
  FileText,
  KeyRound,
  Lightbulb,
  NotebookPen,
  Pen,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Terminal,
  X,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
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

interface TabDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  dark: string;
}

const TABS: TabDefinition[] = [
  { id: "sql", label: "SQL", icon: Terminal, color: "#d3a343", dark: "#6a4c17" },
  { id: "schema", label: "Schema", icon: Database, color: "#6f9daf", dark: "#315361" },
  { id: "notes", label: "Notes", icon: NotebookPen, color: "#81986a", dark: "#405136" },
  { id: "verdict", label: "Verdict", icon: ShieldCheck, color: "#a34b46", dark: "#592522" },
];

const EMPTY_VERDICT: VerdictPayload = {
  culprit: "",
  method: "",
  motive: "",
  narrative: "",
};

function PaperPage({
  side,
  seed,
  children,
}: {
  side: "left" | "right";
  seed: number;
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
      <div className={styles.pageInner}>{children}</div>
    </article>
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

function TabButton({
  tab,
  index,
  active,
  side,
  onSelect,
}: {
  tab: TabDefinition;
  index: number;
  active: boolean;
  side: "left" | "right";
  onSelect: (index: number) => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      className={`${styles.dividerTab} ${styles[side]} ${active ? styles.activeTab : ""}`}
      style={
        {
          "--tab-slot": index,
          "--tab-color": tab.color,
          "--tab-dark": tab.dark,
        } as React.CSSProperties
      }
      onClick={() => onSelect(index)}
      aria-current={active ? "page" : undefined}
      aria-label={`Open ${tab.label} section`}
    >
      <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
      <span>{tab.label}</span>
    </button>
  );
}

export function CaseNotebook({ mystery, schema }: CaseNotebookProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [sqlText, setSqlText] = useState(mystery.starterSql);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [notes, setNotes] = useState("");
  const [revealedHints, setRevealedHints] = useState(0);
  const [verdict, setVerdict] = useState<VerdictPayload>(EMPTY_VERDICT);
  const [verdictResult, setVerdictResult] = useState<VerdictResult | null>(null);
  const [verdictRunning, setVerdictRunning] = useState(false);
  const [schemaSearch, setSchemaSearch] = useState("");
  const [erZoom, setErZoom] = useState(1);
  const [storageReady, setStorageReady] = useState(false);
  const deferredSchemaSearch = useDeferredValue(schemaSearch);
  const queryRun = useRef(0);

  useEffect(() => {
    const el = document.querySelector(`.${styles.erScrollArea}`) as HTMLElement | null;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.01;
        setErZoom((z) => Math.min(3, Math.max(0.3, z + delta)));
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const filteredSchema = schema.filter((table) => {
    const query = deferredSchemaSearch.trim().toLocaleLowerCase("en");
    return (
      !query ||
      table.name.toLocaleLowerCase("en").includes(query) ||
      table.columns.some((column) => column.name.toLocaleLowerCase("en").includes(query))
    );
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const key = (field: string) => `sqlmm:${mystery.slug}:${field}`;
      const savedSql = localStorage.getItem(key("sql"));
      const savedNotes = localStorage.getItem(key("notes"));
      const savedHints = Number(localStorage.getItem(key("hints")) ?? 0);
      const savedTab = Number(localStorage.getItem(key("tab")) ?? 0);
      const savedVerdict = localStorage.getItem(key("verdict"));

      if (savedSql) setSqlText(savedSql);
      if (savedNotes) setNotes(savedNotes);
      if (Number.isInteger(savedHints)) {
        setRevealedHints(Math.min(Math.max(savedHints, 0), mystery.hints.length));
      }
      if (Number.isInteger(savedTab) && savedTab >= 0 && savedTab < TABS.length) {
        setActiveTab(savedTab);
      }
      if (savedVerdict) {
        try {
          setVerdict({ ...EMPTY_VERDICT, ...JSON.parse(savedVerdict) });
        } catch {
          localStorage.removeItem(key("verdict"));
        }
      }
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
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
    localStorage.setItem(`sqlmm:${mystery.slug}:verdict`, JSON.stringify(verdict));
  }, [mystery.slug, storageReady, verdict]);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(`sqlmm:${mystery.slug}:tab`, String(activeTab));
  }, [activeTab, mystery.slug, storageReady]);

  function openTab(index: number) {
    if (index === activeTab || index < 0 || index >= TABS.length) return;
    startTransition(() => setActiveTab(index));
  }

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

  function updateVerdict(field: keyof VerdictPayload, value: string) {
    setVerdict((current) => ({ ...current, [field]: value }));
    setVerdictResult(null);
  }

  async function submitVerdict(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerdictRunning(true);

    try {
      const response = await fetch(`/api/cases/${mystery.slug}/verdict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verdict),
      });
      const result = (await response.json()) as VerdictResult;
      setVerdictResult(result);
      if (result.solved) {
        localStorage.setItem(`sqlmm:${mystery.slug}:solved`, "true");
      }
    } catch {
      setVerdictResult({
        solved: false,
        fields: { culprit: false, method: false, motive: false },
        message: "The report could not be filed. Try again.",
      });
    } finally {
      setVerdictRunning(false);
    }
  }

  function renderSqlSpread() {
    return (
      <>
          <PaperPage side="left" seed={17}>
          <PageHeading kicker="Evidence terminal">Interrogate the records</PageHeading>
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
        </PaperPage>

          <PaperPage side="right" seed={34}>
          <PageHeading kicker="Returned evidence">Results</PageHeading>
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
                <Search size={38} strokeWidth={1.25} />
                <h3>The records are waiting</h3>
                <p>Run a query on the left. Results will be logged here without altering the evidence.</p>
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
                <FileText size={34} strokeWidth={1.3} />
                <h3>No matching records</h3>
                <p>The query ran successfully but returned no rows. Check names, values, and time boundaries.</p>
              </div>
            )}
            {queryResult?.ok && queryResult.rows.length > 0 && <ResultTable result={queryResult} />}
          </div>
          {queryResult?.ok && queryResult.truncated && (
            <p className={styles.truncatedNote}>Display stopped at 200 rows. Refine the query to narrow the evidence.</p>
          )}
        </PaperPage>
      </>
    );
  }

  function renderSchemaSpread() {
    return (
      <>
          <PaperPage side="left" seed={51}>
          <PageHeading kicker="Evidence catalog">Database schema</PageHeading>
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
          <p className={styles.schemaIntro}>{schema.length} tables in this evidence file. Query them from the SQL tab &mdash; the truth is in the rows.</p>
          
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
                      <th>key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col) => (
                      <tr key={col.name}>
                        <td className={styles.schemaColName}>{col.name}</td>
                        <td>{col.type || "—"}</td>
                        <td>{col.primaryKey ? "PK" : col.notNull ? "NN" : ""}</td>
                      </tr>
                    ))}
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
        </PaperPage>

          <PaperPage side="right" seed={68}>
          <PageHeading kicker="Relationships">Entity diagram</PageHeading>
          
          <div className={styles.erDiagram}>
            <div className={styles.erControls}>
              <button type="button" onClick={() => setErZoom((z) => Math.max(0.5, z - 0.1))} aria-label="Zoom out">−</button>
              <span>{Math.round(erZoom * 100)}%</span>
              <button type="button" onClick={() => setErZoom((z) => Math.min(2, z + 0.1))} aria-label="Zoom in">+</button>
              <button type="button" onClick={() => setErZoom(1)} aria-label="Reset zoom">Reset</button>
            </div>
            <div className={styles.erScrollArea}>
              <svg viewBox="0 0 1200 800" className={styles.erSvg} style={{ transform: `scale(${erZoom})`, transformOrigin: "top left" }} preserveAspectRatio="xMinYMin meet">
                {schema.map((table, tableIndex) => {
                  const cols = 3;
                  const x = 40 + (tableIndex % cols) * 380;
                  const y = 40 + Math.floor(tableIndex / cols) * 200;
                  const boxHeight = 50 + table.columns.length * 16;
                  
                  return (
                    <g key={table.name} className={styles.erTable}>
                      <rect x={x} y={y} width={350} height={boxHeight} rx={4} className={styles.erTableBox} />
                      <rect x={x} y={y} width={350} height={26} rx={4} className={styles.erTableHeader} />
                      <text x={x + 175} y={y + 18} className={styles.erTableName}>{table.name}</text>
                      
                      {table.columns.map((column, colIndex) => {
                        const isPk = column.primaryKey;
                        const isFk = table.foreignKeys.some((fk) => fk.from === column.name);
                        return (
                          <g key={column.name}>
                            <text x={x + 10} y={y + 44 + colIndex * 16} className={styles.erColumn}>
                              {isPk && <tspan className={styles.erPk}>PK </tspan>}
                              {isFk && <tspan className={styles.erFk}>FK </tspan>}
                              {column.name}
                            </text>
                            <text x={x + 340} y={y + 44 + colIndex * 16} className={styles.erType}>{column.type}</text>
                          </g>
                        );
                      })}
                      
                      <rect x={x + 320} y={y - 8} width={30} height={16} rx={8} className={styles.erBadge} />
                      <text x={x + 335} y={y + 3} className={styles.erBadgeText}>{table.rowCount}</text>
                    </g>
                  );
                })}
                
                {schema.map((table) =>
                  table.foreignKeys.map((fk) => {
                    const sourceIdx = schema.findIndex((t) => t.name === table.name);
                    const targetIdx = schema.findIndex((t) => t.name === fk.targetTable);
                    if (sourceIdx === -1 || targetIdx === -1) return null;
                    
                    const cols = 3;
                    const sourceX = 40 + (sourceIdx % cols) * 380 + 350;
                    const sourceY = 40 + Math.floor(sourceIdx / cols) * 200 + 35;
                    const targetX = 40 + (targetIdx % cols) * 380;
                    const targetY = 40 + Math.floor(targetIdx / cols) * 200 + 35;
                    const midX = (sourceX + targetX) / 2;
                    
                    return (
                      <path
                        key={`${table.name}-${fk.from}`}
                        d={`M${sourceX},${sourceY} C${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`}
                        className={styles.erLine}
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })
                )}
                
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" className={styles.erArrow} />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
          
          <section className={styles.relationships}>
            <h3>All relationships</h3>
            {schema.filter((t) => t.foreignKeys.length > 0).flatMap((table) =>
              table.foreignKeys.map((fk) => (
                <code key={`${table.name}-${fk.from}`}>
                  {table.name}.{fk.from} → {fk.targetTable}.{fk.targetColumn}
                </code>
              ))
            )}
            {schema.every((t) => t.foreignKeys.length === 0) && (
              <p>No foreign key relationships defined in this database.</p>
            )}
          </section>
        </PaperPage>
      </>
    );
  }

  function renderNotesSpread() {
    return (
      <>
          <PaperPage side="left" seed={85}>
          <div className={styles.briefClip} aria-hidden="true" />
          <header className={styles.briefHeader}>
            <span>Confidential // {mystery.caseNumber}</span>
            <h2>Case brief</h2>
            <b>{mystery.title}</b>
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
        </PaperPage>

          <PaperPage side="right" seed={102}>
          <PageHeading kicker="Private working file">Investigation notes</PageHeading>
          <label className={styles.notesField}>
            <span className={styles.srOnly}>Investigation notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={"Write names, joins, contradictions, and theories here...\n\nYour notes save automatically on this device."}
            />
          </label>
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
        </PaperPage>
      </>
    );
  }

  function renderVerdictSpread() {
    const fieldStatus = (field: keyof VerdictResult["fields"]) => {
      if (!verdictResult) return undefined;
      return verdictResult.fields[field] ? "correct" : "incorrect";
    };

    return (
      <>
          <PaperPage side="left" seed={119}>
          <PageHeading kicker="Before you file">Does the theory hold?</PageHeading>
          <p className={styles.verdictIntro}>A suspicion is not a solution. Your report must explain all three parts of the crime.</p>
          <ol className={styles.proofList}>
            <li><span>01</span><div><b>Identity</b><p>One person must satisfy every independent evidence chain, not merely one suspicious record.</p></div></li>
            <li><span>02</span><div><b>Method</b><p>The physical method must agree with the forensic findings, access window, and available means.</p></div></li>
            <li><span>03</span><div><b>Motive</b><p>Show what the victim discovered, threatened, or intended to reveal.</p></div></li>
          </ol>
          <div className={styles.skillsStamp}>
            <span>Methods expected</span>
            {mystery.skills.map((skill) => <b key={skill}>{skill}</b>)}
          </div>
          <blockquote className={styles.detectiveQuote}>“The rows do not confess. They contradict.”</blockquote>
        </PaperPage>

          <PaperPage side="right" seed={136}>
          <PageHeading kicker="Municipal Investigation Unit">File your verdict</PageHeading>
          <form className={styles.verdictForm} onSubmit={submitVerdict}>
            <label data-status={fieldStatus("culprit")}>
              <span>Who killed {mystery.victim.split(",")[0]}?</span>
              <div>
                <input
                  required
                  value={verdict.culprit}
                  onChange={(event) => updateVerdict("culprit", event.target.value)}
                  placeholder="Full name or known alias"
                />
                {fieldStatus("culprit") === "correct" && <Check size={17} />}
                {fieldStatus("culprit") === "incorrect" && <X size={17} />}
              </div>
            </label>
            <label data-status={fieldStatus("method")}>
              <span>How was the murder carried out?</span>
              <div>
                <textarea
                  required
                  value={verdict.method}
                  onChange={(event) => updateVerdict("method", event.target.value)}
                  placeholder="Name the means and explain how it was used"
                />
                {fieldStatus("method") === "correct" && <Check size={17} />}
                {fieldStatus("method") === "incorrect" && <X size={17} />}
              </div>
            </label>
            <label data-status={fieldStatus("motive")}>
              <span>What was the primary motive?</span>
              <div>
                <textarea
                  required
                  value={verdict.motive}
                  onChange={(event) => updateVerdict("motive", event.target.value)}
                  placeholder="What did the killer stand to hide, protect, or avenge?"
                />
                {fieldStatus("motive") === "correct" && <Check size={17} />}
                {fieldStatus("motive") === "incorrect" && <X size={17} />}
              </div>
            </label>
            <label>
              <span>Detective’s reconstruction <i>optional</i></span>
              <textarea
                value={verdict.narrative}
                onChange={(event) => updateVerdict("narrative", event.target.value)}
                placeholder="Cite the records that make the conclusion unavoidable..."
              />
            </label>
            <button className={styles.signOff} type="submit" disabled={verdictRunning}>
              <Pen size={15} /> {verdictRunning ? "Checking evidence..." : "Sign off"}
            </button>
          </form>
          {verdictResult && (
            <div
              className={`${styles.verdictResponse} ${verdictResult.solved ? styles.caseClosed : styles.caseOpen}`}
              role="status"
            >
              <b>{verdictResult.solved ? "Case closed" : "Theory incomplete"}</b>
              <p>{verdictResult.message}</p>
              {verdictResult.reconstruction && <p>{verdictResult.reconstruction}</p>}
              {verdictResult.solved && <Link href="/">Return to case board</Link>}
            </div>
          )}
        </PaperPage>
      </>
    );
  }

  const spreads = [renderSqlSpread, renderSchemaSpread, renderNotesSpread, renderVerdictSpread];
  const ActiveIcon = TABS[activeTab].icon;

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

          <nav className={`${styles.tabRail} ${styles.rightRail}`} aria-label="Current and upcoming notebook sections">
            {TABS.map((tab, index) => (
              <TabButton key={tab.id} tab={tab} index={index} active={index === activeTab} side="right" onSelect={openTab} />
            ))}
          </nav>

          <div className={styles.spread}>
            {spreads[activeTab]()}
            <button
              type="button"
              className={`${styles.spreadNav} ${styles.spreadPrev}`}
              onClick={() => openTab(activeTab - 1)}
              disabled={activeTab === 0 || undefined}
              aria-label="Previous section"
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <button
              type="button"
              className={`${styles.spreadNav} ${styles.spreadNext}`}
              onClick={() => openTab(activeTab + 1)}
              disabled={activeTab === TABS.length - 1 || undefined}
              aria-label="Next section"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>

          <div className={styles.binding} aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
          </div>
        </div>

        <nav className={styles.mobileTabs} aria-label="Notebook sections">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => openTab(index)}
                className={index === activeTab ? styles.mobileActive : ""}
                style={{ "--tab-color": tab.color } as React.CSSProperties}
                aria-current={index === activeTab ? "page" : undefined}
              >
                <Icon size={16} /> <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>


      </section>


    </main>
  );
}
