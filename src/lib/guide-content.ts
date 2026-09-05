export interface GuideEntry {
  label: string;
  code: string;
}

export interface GuideSection {
  id: string;
  title: string;
  entries: GuideEntry[];
}

/**
 * Quick-lookup reference. Every entry is a copyable pattern — swap in real
 * table and column names from the Schema page before running.
 */
export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "select",
    title: "Select",
    entries: [
      { label: "all columns", code: "SELECT * FROM guests LIMIT 10;" },
      { label: "columns", code: "SELECT name, floor FROM guests;" },
      { label: "AS rename", code: "SELECT full_name AS name FROM persons;" },
      { label: "DISTINCT", code: "SELECT DISTINCT engine_type FROM suspects;" },
      { label: "ORDER BY · LIMIT", code: "SELECT name, floor FROM guests ORDER BY floor DESC LIMIT 10;" },
    ],
  },
  {
    id: "where",
    title: "Where",
    entries: [
      { label: "= <> >", code: "SELECT name FROM guests WHERE floor = 2 AND hair_color = 'red';" },
      { label: "OR · NOT", code: "SELECT name FROM guests WHERE accessory = 'monocle' OR floor <> 1;" },
      { label: "IN", code: "SELECT card_id FROM lab_access WHERE lab IN ('A-01', 'B-12');" },
      { label: "BETWEEN", code: "SELECT * FROM access_logs WHERE entered_at BETWEEN '21:40' AND '22:05';" },
      { label: "LIKE %", code: "SELECT * FROM evidence WHERE description LIKE '%grease%';" },
      { label: "starts with", code: "SELECT * FROM members WHERE id LIKE '48Z%';" },
      { label: "IS NULL", code: "SELECT * FROM loans WHERE returned_at IS NULL;" },
    ],
  },
  {
    id: "join",
    title: "Join",
    entries: [
      {
        label: "JOIN … ON",
        code: "SELECT p.full_name, a.entered_at\nFROM persons AS p\nJOIN access_logs AS a ON a.person_id = p.person_id;",
      },
      {
        label: "text keys",
        code: "SELECT s.name, l.entry FROM students AS s\nJOIN lab_access AS l ON l.card_id = s.card_id;",
      },
      {
        label: "LEFT JOIN",
        code: "SELECT s.name, l.entry FROM students AS s\nLEFT JOIN lab_access AS l ON l.card_id = s.card_id;",
      },
    ],
  },
  {
    id: "group",
    title: "Group",
    entries: [
      { label: "COUNT", code: "SELECT boat_name, COUNT(*) AS n FROM gps_pings GROUP BY boat_name;" },
      {
        label: "HAVING",
        code: "SELECT approved_by_person_id, COUNT(*) AS n FROM payments\nGROUP BY approved_by_person_id HAVING COUNT(*) >= 3;",
      },
      { label: "DISTINCT count", code: "SELECT COUNT(DISTINCT boat_name) FROM gps_pings;" },
    ],
  },
  {
    id: "time",
    title: "Time overlap",
    entries: [
      {
        label: "present during",
        code: "SELECT p.full_name FROM persons AS p\nJOIN access_logs AS a ON a.person_id = p.person_id\nWHERE a.entered_at < '2026-02-17 21:54:00'\nAND a.exited_at > '2026-02-17 21:49:00';",
      },
    ],
  },
];
