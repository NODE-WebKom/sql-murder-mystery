"use client";

import { BookOpen, Check, Copy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PaperTexture } from "@paper-design/shaders-react";

import { GUIDE_SECTIONS, type GuideEntry, type GuideSection } from "@/lib/guide-content";
import { SqlCode } from "./sql-code";

import styles from "./desk-guide.module.css";

export function GuideTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className={styles.slip}
      onClick={onOpen}
      aria-haspopup="dialog"
      title="Open the SQL cheat sheet"
    >
      <span className={styles.slipFold} aria-hidden="true" />
      <BookOpen size={14} strokeWidth={2} aria-hidden="true" />
      <span className={styles.slipText}>Cheat sheet</span>
    </button>
  );
}

function GuideRow({ label, code }: GuideEntry) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard unavailable (permissions, insecure context): select manually.
      return;
    }
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <pre className={styles.code}>
        <SqlCode code={code} />
      </pre>
      <button
        type="button"
        className={styles.copyButton}
        onClick={copy}
        aria-label={`Copy ${label} example`}
      >
        {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      </button>
    </div>
  );
}

function GuideBlock({ title, entries }: GuideSection) {
  return (
    <section className={styles.card} aria-label={title}>
      <h3>{title}</h3>
      <div className={styles.rows}>
        {entries.map((entry) => (
          <GuideRow key={entry.label} {...entry} />
        ))}
      </div>
    </section>
  );
}

export function DeskGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="SQL cheat sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <PaperTexture
          className={styles.sheetShader}
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
          seed={51}
          maxPixelCount={320_000}
          aria-hidden="true"
        />
        <div className={styles.sheetInner}>
          <header className={styles.sheetHead}>
            <div>
              <span className={styles.kicker}>Same on every case</span>
              <h2>SQL cheat sheet</h2>
              <p>
                Swap in real table and column names from the Schema page.
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close cheat sheet"
            >
              <X size={16} aria-hidden="true" />
              Close
            </button>
          </header>
          <div className={styles.cards}>
            {GUIDE_SECTIONS.map((section) => (
              <GuideBlock key={section.id} {...section} />
            ))}
          </div>
          <p className={styles.footnote}>
            Read-only: SELECT · WITH · EXPLAIN QUERY PLAN. Max 200 rows.
          </p>
        </div>
      </div>
    </div>
  );
}
