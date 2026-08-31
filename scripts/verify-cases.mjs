import Database from "better-sqlite3";
import assert from "node:assert/strict";
import { join } from "node:path";

const cases = [
  {
    slug: "the-last-espresso",
    expected: "Elise Harrow",
    query: `
      SELECT DISTINCT p.full_name
      FROM persons AS p
      JOIN access_logs AS a ON a.person_id = p.person_id
      JOIN purchases AS pu ON pu.purchaser_id = p.person_id
      JOIN locations AS l ON l.location_id = a.location_id
      JOIN products AS product ON product.product_id = pu.product_id
      WHERE l.location_name = 'Nightjar Cafe - service station'
        AND a.entered_at < '2026-02-17 21:54:00'
        AND a.exited_at > '2026-02-17 21:49:00'
        AND product.product_name = 'Hazelnut baking extract'
        AND pu.purchased_at >= '2026-02-14 00:00:00'
        AND pu.purchased_at < '2026-02-17 21:49:00'
    `,
  },
  {
    slug: "the-blackthorn-ledger",
    expected: "Mara Voss",
    query: `
      WITH financial_pattern AS (
        SELECT pay.approved_by_person_id AS person_id
        FROM payments AS pay
        JOIN vendors AS v ON v.vendor_id = pay.vendor_id
        GROUP BY pay.approved_by_person_id, v.payout_account_ref
        HAVING COUNT(DISTINCT v.vendor_id) >= 2
           AND COUNT(*) >= 3
           AND SUM(pay.amount_cents) > 9000000
      ),
      matching_loans AS (
        SELECT loan.borrower_person_id AS person_id
        FROM equipment_loans AS loan
        JOIN equipment_items AS item ON item.item_id = loan.item_id
        WHERE item.item_type = 'utility_pump'
          AND item.power_source = 'gasoline'
          AND loan.checked_out_at <= '2026-10-17 22:04:00'
          AND COALESCE(loan.returned_at, loan.due_at) >= '2026-10-17 21:46:00'
      ),
      service_visits AS (
        SELECT badge.assigned_person_id AS person_id
        FROM access_events AS entry
        JOIN access_events AS departure
          ON departure.badge_id = entry.badge_id
         AND departure.location_id = entry.location_id
         AND departure.action = 'exit'
         AND departure.occurred_at > entry.occurred_at
        JOIN badges AS badge ON badge.badge_id = entry.badge_id
        JOIN locations AS location ON location.location_id = entry.location_id
        WHERE location.name = 'Archive Service Level'
          AND entry.action = 'enter'
          AND entry.result = 'granted'
          AND departure.result = 'granted'
          AND entry.occurred_at <= '2026-10-17 22:04:00'
        GROUP BY badge.assigned_person_id, entry.access_event_id, entry.occurred_at
        HAVING MIN(departure.occurred_at) >= '2026-10-17 21:46:00'
          AND strftime('%s', MIN(departure.occurred_at)) - strftime('%s', entry.occurred_at) >= 600
      )
      SELECT p.full_name
      FROM persons AS p
      JOIN financial_pattern AS f ON f.person_id = p.person_id
      JOIN matching_loans AS m ON m.person_id = p.person_id
      JOIN service_visits AS s ON s.person_id = p.person_id
    `,
  },
  {
    slug: "midnight-at-pier-nine",
    expected: "Celia Rook",
    query: `
      WITH route_candidates AS (
        SELECT cr.person_id
        FROM credentials AS cr
        JOIN access_events AS ae ON ae.credential_id = cr.credential_id
        JOIN locations AS l ON l.location_id = ae.location_id
        WHERE ae.outcome = 'GRANTED'
          AND ae.occurred_at BETWEEN '2026-11-14T20:00:00' AND '2026-11-15T00:20:00'
          AND l.location_code IN ('ASTER_ANNEX', 'P9_GATE', 'N9_VEST')
        GROUP BY cr.person_id
        HAVING COUNT(DISTINCT l.location_code) = 3
      ),
      sedative_balance AS (
        SELECT cr.person_id
        FROM inventory_movements AS im
        JOIN credentials AS cr ON cr.credential_id = im.credential_id
        JOIN inventory_items AS item ON item.item_id = im.item_id
        WHERE item.sku = 'S17-VIAL'
        GROUP BY cr.person_id
        HAVING SUM(CASE im.movement_type WHEN 'OUT' THEN im.quantity ELSE -im.quantity END) > 0
      ),
      lethal_controls AS (
        SELECT cr.person_id
        FROM device_events AS de
        JOIN devices AS d ON d.device_id = de.device_id
        JOIN locations AS l ON l.location_id = d.location_id
        JOIN credentials AS cr ON cr.credential_id = de.actor_credential_id
        WHERE l.location_code = 'N9_CHAMBER'
          AND de.occurred_at BETWEEN '2026-11-14T23:40:00' AND '2026-11-15T00:10:00'
          AND de.event_type IN ('SAFETY_BYPASS', 'PURGE_START')
        GROUP BY cr.person_id
        HAVING COUNT(DISTINCT de.event_type) = 2
      ),
      motive_mentions AS (
        SELECT pa.person_id
        FROM person_aliases AS pa
        JOIN communications AS cm ON instr(lower(cm.body), lower(pa.alias)) > 0
        WHERE cm.sender_person_id = 1
        GROUP BY pa.person_id
        HAVING COUNT(DISTINCT cm.communication_id) >= 2
      )
      SELECT p.full_name
      FROM people AS p
      JOIN route_candidates AS r ON r.person_id = p.person_id
      JOIN sedative_balance AS s ON s.person_id = p.person_id
      JOIN lethal_controls AS l ON l.person_id = p.person_id
      JOIN motive_mentions AS m ON m.person_id = p.person_id
      WHERE p.life_status = 'alive'
    `,
  },
];

for (const mystery of cases) {
  const database = new Database(
    join(process.cwd(), "data", "cases", `${mystery.slug}.db`),
    { readonly: true, fileMustExist: true },
  );
  const rows = database.prepare(mystery.query).all();
  database.close();

  assert.equal(rows.length, 1, `${mystery.slug} must have exactly one solution`);
  assert.equal(rows[0].full_name, mystery.expected, `${mystery.slug} culprit changed`);
  console.log(`Verified ${mystery.slug}: one unique evidence chain`);
}
