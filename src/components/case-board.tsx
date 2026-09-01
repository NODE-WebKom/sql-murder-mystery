"use client";

import { Database } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CaseDefinition, CaseSlug } from "@/lib/types";

import styles from "./case-board.module.css";


/** Post-it colour per difficulty: green, yellow, red as the tiers climb. */
const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "#b6cf92",
  Intermediate: "#f0d87a",
  Advanced: "#dd9b8f",
};

const DIFFICULTY_ORDER: Record<string, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

interface PinPos {
  x: number;
  y: number;
}

function buildThreadPath(points: PinPos[]): string {
  if (points.length < 2) return "";
  const pts = points.map((p) => ({ x: p.x, y: p.y }));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const mx = (prev.x + curr.x) / 2;
    const sag = 12 + Math.abs(curr.x - prev.x) * 0.06;
    d += ` C${mx} ${prev.y + sag} ${mx} ${curr.y + sag} ${curr.x} ${curr.y}`;
  }
  return d;
}

export function CaseBoard({ cases }: { cases: CaseDefinition[] }) {
  // Grouped by difficulty, easiest first, keeping the original order within a tier.
  const ordered = [...cases].sort(
    (a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 0) - (DIFFICULTY_ORDER[b.difficulty] ?? 0),
  );
  // slug -> leads opened before the case was closed
  const [solved, setSolved] = useState<Map<CaseSlug, number>>(new Map());
  const [pinPositions, setPinPositions] = useState<PinPos[]>([]);
  const boardRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const measurePins = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();
    const positions: PinPos[] = cardRefs.current.map((card) => {
      if (!card) return { x: 0, y: 0 };
      const rect = card.getBoundingClientRect();
      return {
        x: rect.left - boardRect.left + rect.width / 2,
        y: rect.top - boardRect.top + 12,
      };
    });
    setPinPositions(positions);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const completed = new Map<CaseSlug, number>();
      for (const mystery of cases) {
        if (localStorage.getItem(`sqlmm:${mystery.slug}:solved`) !== "true") continue;
        const opened = Number(localStorage.getItem(`sqlmm:${mystery.slug}:hints`));
        const leads = Number.isInteger(opened) ? Math.min(Math.max(opened, 0), mystery.hints.length) : 0;
        completed.set(mystery.slug, leads);
      }
      setSolved(completed);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [cases]);

  useEffect(() => {
    measurePins();
    window.addEventListener("resize", measurePins);
    return () => window.removeEventListener("resize", measurePins);
  }, [measurePins, cases.length]);

  const threadPath = buildThreadPath(pinPositions);
  const boardWidth = boardRef.current?.offsetWidth ?? 1200;
  const boardHeight = boardRef.current?.offsetHeight ?? 800;

  return (
    <main className={styles.scene}>
      <div className={styles.boardFrame}>
        <section className={styles.board} aria-labelledby="board-title" ref={boardRef}>
          <div className={styles.boardShade} />
          <header className={styles.masthead}>
            <h1 id="board-title">SQL Murder Mystery</h1>
          </header>

          <div className={styles.caseCount} aria-label={`${solved.size} of ${cases.length} cases solved`}>
            <Database size={15} aria-hidden="true" />
            <span>{solved.size}/{cases.length} files closed</span>
          </div>

          {pinPositions.length >= 2 && (
            <svg
              className={styles.thread}
              viewBox={`0 0 ${boardWidth} ${boardHeight}`}
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <defs>
                <radialGradient id="pinGrad" cx="34%" cy="28%">
                  <stop offset="0%" stopColor="#ef8c75" />
                  <stop offset="15%" stopColor="#ef8c75" />
                  <stop offset="28%" stopColor="#a22f29" />
                  <stop offset="68%" stopColor="#a22f29" />
                  <stop offset="72%" stopColor="#551513" />
                </radialGradient>
              </defs>
              <path d={threadPath} className={styles.threadPath} />
              <path d={threadPath} className={styles.threadHighlight} />
              {pinPositions.map((pos, i) => (
                <circle key={i} cx={pos.x} cy={pos.y} r={7.5} fill="url(#pinGrad)" className={styles.threadKnot} />
              ))}
            </svg>
          )}

          <ol className={styles.caseGrid}>
            {ordered.map((mystery, index) => {
              const bgColor = DIFFICULTY_COLORS[mystery.difficulty] ?? DIFFICULTY_COLORS.Beginner;
              const leads = solved.get(mystery.slug);
              const closed = leads !== undefined;
              return (
                <li key={mystery.slug}>
                  <Link
                    href={`/case/${mystery.slug}`}
                    className={`${styles.caseFile} ${styles[`case${(index % 3) + 1}`]}`}
                    style={
                      {
                        "--case-accent": mystery.accent,
                        "--postit-color": bgColor,
                      } as React.CSSProperties
                    }
                    ref={(el) => { cardRefs.current[index] = el; }}
                  >
                    <div className={styles.postitNoise} aria-hidden="true" />
                    <span className={styles.fileTopline}>
                      <span>{mystery.caseNumber}</span>
                      <span className={styles.difficulty}>{mystery.difficulty}</span>
                    </span>
                    <strong>{mystery.title}</strong>
                    <span className={styles.boardNote}>{mystery.boardNote}</span>
                    {closed && (
                      <span className={styles.stamp}>
                        <b>Case closed</b>
                        <i>{leads === 0 ? "No leads used" : `${leads} lead${leads === 1 ? "" : "s"} used`}</i>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>

        </section>
      </div>
    </main>
  );
}
