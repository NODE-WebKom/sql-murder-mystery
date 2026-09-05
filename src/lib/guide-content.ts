export interface GuideEntry {
  label: string;
  /** One plain-language line: when to reach for this pattern. */
  hint: string;
  code: string;
  /** Optional divider shown above the row, grouping related rows. */
  group?: string;
}

export interface GuideSection {
  id: string;
  /** Numbered, workflow-ordered title, e.g. "1 · Look at a table". */
  title: string;
  entries: GuideEntry[];
}

/**
 * Quick-lookup reference for total SQL beginners. Ordered like a real
 * investigation: peek at a table, keep interesting rows, connect tables,
 * then count up and close the case. Every entry shows exactly one idea —
 * copy it, then swap in real table and column names from the Schema page.
 */
export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "look",
    title: "1 · Look at a table",
    entries: [
      {
        label: "Peek at the first rows",
        hint: "Start here. Shows what columns a table actually has.",
        code: "SELECT * FROM guests LIMIT 10;",
      },
      {
        label: "Show just some columns",
        hint: "Replace names with real columns from the Schema page.",
        code: "SELECT name, floor FROM guests;",
      },
      {
        label: "Sort, then take the top few",
        hint: "Highest first with DESC, lowest first with ASC.",
        code: "SELECT name, floor FROM guests ORDER BY floor DESC LIMIT 10;",
      },
    ],
  },
  {
    id: "filter",
    title: "2 · Keep only the rows you want",
    entries: [
      {
        label: "Equal to (=)",
        hint: "Numbers stand alone. Text needs 'single quotes'.",
        group: "Compare one value",
        code: "SELECT name FROM guests WHERE floor = 2;",
      },
      {
        label: "Not equal to (<>)",
        hint: "<> means not equal. Reads as everyone except these.",
        group: "Compare one value",
        code: "SELECT name FROM guests WHERE floor <> 1;",
      },
      {
        label: "Bigger or smaller (>, <)",
        hint: "> is bigger, < is smaller. Add = for or-equal: >=, <=.",
        group: "Compare one value",
        code: "SELECT name FROM guests WHERE floor > 1;",
      },
      {
        label: "Both must be true (AND)",
        hint: "Narrows results. Each side is one check from above.",
        group: "Combine checks",
        code: "SELECT name FROM guests WHERE floor = 2 AND hair_color = 'red';",
      },
      {
        label: "Either may be true (OR)",
        hint: "Widens results. The opposite of AND.",
        group: "Combine checks",
        code: "SELECT name FROM guests WHERE floor = 1 OR floor = 2;",
      },
      {
        label: "Flip a check (NOT)",
        hint: "NOT turns true into false. For plain not-equal, <> above is shorter.",
        group: "Combine checks",
        code: "SELECT name FROM guests WHERE NOT floor = 1;",
      },
      {
        label: "Match a short list (IN)",
        hint: "Shorter than many ORs. Text works too: hair_color IN ('red', 'black').",
        group: "Lists, ranges, text, missing",
        code: "SELECT name FROM guests WHERE floor IN (1, 2);",
      },
      {
        label: "Match a range (BETWEEN)",
        hint: "Includes both ends. Also good for times: entered_at BETWEEN '21:40' AND '22:05'.",
        group: "Lists, ranges, text, missing",
        code: "SELECT name FROM guests WHERE floor BETWEEN 1 AND 2;",
      },
      {
        label: "Text contains (LIKE %…%)",
        hint: "% stands for anything. % on both sides finds it anywhere.",
        group: "Lists, ranges, text, missing",
        code: "SELECT name FROM guests WHERE name LIKE '%an%';",
      },
      {
        label: "Text starts with (LIKE …%)",
        hint: "% only at the end means the text must start this way.",
        group: "Lists, ranges, text, missing",
        code: "SELECT name FROM guests WHERE name LIKE 'An%';",
      },
      {
        label: "Find missing values (IS NULL)",
        hint: "= NULL never works. IS NOT NULL finds the opposite.",
        group: "Lists, ranges, text, missing",
        code: "SELECT name FROM guests WHERE accessory IS NULL;",
      },
    ],
  },
  {
    id: "join",
    title: "3 · Connect two tables",
    entries: [
      {
        label: "Short names (AS)",
        hint: "AS renames a column — or a whole table, as in the next two rows.",
        code: "SELECT full_name AS name FROM persons;",
      },
      {
        label: "Match rows across tables (JOIN)",
        hint: "p and a are nicknames from AS above. ON says which columns must match.",
        code: "SELECT p.full_name, a.entered_at\nFROM persons AS p\nJOIN access_logs AS a ON a.person_id = p.person_id;",
      },
      {
        label: "Keep everyone, even with no match (LEFT JOIN)",
        hint: "Keeps all left-side rows. Missing partners show as empty (NULL).",
        code: "SELECT s.name, l.entry FROM students AS s\nLEFT JOIN lab_access AS l ON l.card_id = s.card_id;",
      },
      {
        label: "Look up a list first (subquery)",
        hint: "The inside query runs first and hands a list to IN. Same answer as a JOIN — pick whichever reads clearer.",
        code: "SELECT full_name FROM persons\nWHERE person_id IN (SELECT person_id FROM access_logs WHERE entered_at > '2026-02-17 21:00:00');",
      },
    ],
  },
  {
    id: "finish",
    title: "4 · Count up and close the case",
    entries: [
      {
        label: "Count per group",
        hint: "AS n names the count so you can read it.",
        code: "SELECT boat_name, COUNT(*) AS n FROM gps_pings GROUP BY boat_name;",
      },
      {
        label: "Keep only big groups (HAVING)",
        hint: "WHERE filters rows first. HAVING filters groups after counting.",
        code: "SELECT approved_by_person_id, COUNT(*) AS n FROM payments\nGROUP BY approved_by_person_id HAVING COUNT(*) >= 3;",
      },
      {
        label: "How many different values?",
        hint: "For the list itself instead of the number, use SELECT DISTINCT boat_name FROM gps_pings.",
        code: "SELECT COUNT(DISTINCT boat_name) FROM gps_pings;",
      },
      {
        label: "Were they present at the time?",
        hint: "Someone was there if they entered before the window ended AND left after it started.",
        code: "SELECT p.full_name FROM persons AS p\nJOIN access_logs AS a ON a.person_id = p.person_id\nWHERE a.entered_at < '2026-02-17 21:54:00'\nAND a.exited_at > '2026-02-17 21:49:00';",
      },
    ],
  },
];
