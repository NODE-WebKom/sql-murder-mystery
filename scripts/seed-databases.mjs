import Database from "better-sqlite3";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const outputDirectory = join(process.cwd(), "data", "cases");
mkdirSync(outputDirectory, { recursive: true });

function createDatabase(slug, sql) {
  const databasePath = join(outputDirectory, `${slug}.db`);
  rmSync(databasePath, { force: true });

  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = DELETE");
  database.exec(sql);
  database.pragma("optimize");
  database.close();

  console.log(`Seeded ${slug}.db`);
}

createDatabase(
  "the-last-espresso",
  `
  BEGIN;

  CREATE TABLE persons (
    person_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL UNIQUE,
    occupation TEXT NOT NULL,
    connection_to_victim TEXT NOT NULL
  );

  CREATE TABLE locations (
    location_id INTEGER PRIMARY KEY,
    location_name TEXT NOT NULL UNIQUE,
    location_type TEXT NOT NULL
  );

  CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    product_name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL
  );

  CREATE TABLE access_logs (
    access_id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES persons(person_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    entered_at TEXT NOT NULL,
    exited_at TEXT NOT NULL,
    source TEXT NOT NULL,
    CHECK (exited_at > entered_at)
  );

  CREATE TABLE drink_orders (
    order_id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES persons(person_id),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    prepared_by_id INTEGER NOT NULL REFERENCES persons(person_id),
    pickup_location_id INTEGER NOT NULL REFERENCES locations(location_id),
    ordered_at TEXT NOT NULL,
    ready_at TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    ticket_note TEXT,
    CHECK (ready_at >= ordered_at),
    CHECK (collected_at >= ready_at)
  );

  CREATE TABLE purchases (
    purchase_id INTEGER PRIMARY KEY,
    purchaser_id INTEGER NOT NULL REFERENCES persons(person_id),
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    seller_location_id INTEGER NOT NULL REFERENCES locations(location_id),
    purchased_at TEXT NOT NULL,
    receipt_code TEXT NOT NULL UNIQUE
  );

  CREATE TABLE findings (
    finding_id INTEGER PRIMARY KEY,
    finding_type TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    subject_person_id INTEGER REFERENCES persons(person_id),
    subject_location_id INTEGER REFERENCES locations(location_id),
    subject_product_id INTEGER REFERENCES products(product_id),
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    CHECK (
      subject_person_id IS NOT NULL OR
      subject_location_id IS NOT NULL OR
      subject_product_id IS NOT NULL
    )
  );

  CREATE INDEX idx_access_time ON access_logs(location_id, entered_at, exited_at);
  CREATE INDEX idx_purchases_product ON purchases(product_id, purchased_at);

  INSERT INTO persons VALUES
    (1, 'Gabriel Vale', 'Cafe proprietor', 'Owner of the Nightjar Cafe'),
    (2, 'Elise Harrow', 'Bookkeeper', 'Managed the cafe accounts for six years'),
    (3, 'Mina Cole', 'Barista', 'Closing employee whose shifts were recently reduced'),
    (4, 'Jonah Reed', 'Coffee supplier', 'Vendor whose supply contract was ending'),
    (5, 'Lena Ortiz', 'Pastry chef', 'Employee whose partnership proposal was declined'),
    (6, 'Theo Marsh', 'Property manager', 'Represented the landlord during a lease dispute'),
    (7, 'Ruth Bell', 'Contract cleaner', 'Contractor owed two invoices');

  INSERT INTO locations VALUES
    (1, 'Nightjar Cafe - dining room', 'cafe_room'),
    (2, 'Nightjar Cafe - service station', 'cafe_room'),
    (3, 'Nightjar Cafe - back office', 'cafe_room'),
    (4, 'Nightjar Cafe - loading bay', 'cafe_room'),
    (5, 'Morrow Market', 'retailer'),
    (6, 'Reed Coffee Warehouse', 'warehouse');

  INSERT INTO products VALUES
    (101, 'Double espresso', 'drink'),
    (102, 'Vanilla syrup', 'flavoring'),
    (103, 'Hazelnut baking extract', 'flavoring'),
    (104, 'Almond flour', 'baking ingredient'),
    (105, 'Dock Blend espresso beans', 'coffee ingredient'),
    (106, 'Unscented surface cleaner', 'cleaning supply');

  INSERT INTO drink_orders VALUES
    (5001, 6, 101, 3, 1, '2026-02-17 21:28:00', '2026-02-17 21:31:00', '2026-02-17 21:32:00', 'One sugar'),
    (5002, 4, 101, 3, 4, '2026-02-17 21:42:00', '2026-02-17 21:44:00', '2026-02-17 21:45:00', 'Served during delivery'),
    (5003, 1, 101, 3, 2, '2026-02-17 21:46:00', '2026-02-17 21:49:00', '2026-02-17 21:54:00', 'Plain; no syrup');

  INSERT INTO access_logs VALUES
    (9001, 5, 2, '2026-02-17 18:02:00', '2026-02-17 21:14:00', 'staff badge'),
    (9002, 3, 2, '2026-02-17 21:20:00', '2026-02-17 21:49:28', 'camera'),
    (9003, 6, 1, '2026-02-17 21:24:00', '2026-02-17 21:58:00', 'camera'),
    (9004, 4, 4, '2026-02-17 21:39:00', '2026-02-17 21:57:00', 'delivery camera'),
    (9005, 2, 1, '2026-02-17 21:32:00', '2026-02-17 21:49:52', 'camera'),
    (9006, 3, 4, '2026-02-17 21:49:31', '2026-02-17 21:52:18', 'camera'),
    (9007, 2, 2, '2026-02-17 21:50:10', '2026-02-17 21:52:04', 'camera'),
    (9008, 2, 1, '2026-02-17 21:52:11', '2026-02-17 21:58:30', 'camera'),
    (9009, 3, 2, '2026-02-17 21:52:21', '2026-02-17 22:13:00', 'camera'),
    (9010, 1, 3, '2026-02-17 20:36:00', '2026-02-17 21:53:36', 'door sensor'),
    (9011, 1, 2, '2026-02-17 21:53:40', '2026-02-17 21:54:20', 'camera'),
    (9012, 1, 3, '2026-02-17 21:54:28', '2026-02-17 22:12:00', 'door sensor'),
    (9013, 7, 2, '2026-02-17 22:07:00', '2026-02-17 22:28:00', 'staff badge');

  INSERT INTO purchases VALUES
    (7001, 2, 103, 5, '2026-02-17 20:12:00', 'M-8814'),
    (7002, 4, 103, 5, '2026-02-15 16:40:00', 'M-8730'),
    (7003, 3, 102, 5, '2026-02-17 17:42:00', 'M-8792'),
    (7004, 5, 104, 5, '2026-02-16 18:05:00', 'M-8764'),
    (7005, 7, 106, 5, '2026-02-17 18:52:00', 'M-8801'),
    (7006, 1, 105, 6, '2026-02-13 10:15:00', 'R-4402');

  INSERT INTO findings VALUES
    (8001, 'forensic', '2026-02-18 09:15:00', 1, 2, 103, 'Cup residue', 'Gabriel''s final espresso contained substantial hazelnut protein, consistent with baking extract rather than incidental contact.'),
    (8002, 'medical', '2026-02-17 22:35:00', 1, NULL, NULL, 'Known allergy', 'Gabriel''s medical card and the signed staff safety sheet documented a severe hazelnut allergy.'),
    (8003, 'inventory', '2026-02-17 22:42:00', NULL, 2, NULL, 'Nut-free inventory', 'Stock records contained no nut products. Beans, sugar, milk, and the sealed vanilla syrup tested clean.'),
    (8004, 'timeline', '2026-02-17 22:50:00', NULL, 2, NULL, 'Unattended cup', 'Order 5003 waited from 21:49 until 21:54. Mina was signing for a delivery from 21:49:31 until 21:52:18.'),
    (8005, 'audit', '2026-02-17 23:05:00', 2, 3, NULL, 'Morning audit', 'A printed email scheduled an external audit for 08:30. Fourteen vendor refunds posted through Elise''s login had no matching bank deposits.'),
    (8006, 'interview', '2026-02-17 23:20:00', 2, NULL, NULL, 'Elise Harrow statement', 'Elise said she remained in the dining room from 21:32 until leaving and never crossed behind the counter.'),
    (8007, 'employment', '2026-02-17 23:24:00', 3, NULL, NULL, 'Reduced shifts', 'Gabriel cut two of Mina''s weekend shifts, and they argued earlier that evening.'),
    (8008, 'contract', '2026-02-17 23:28:00', 4, NULL, 103, 'Canceled supplier', 'Gabriel had ended Jonah''s contract. Jonah also bought hazelnut extract, but remained in the loading bay during the critical window.'),
    (8009, 'employment', '2026-02-17 23:31:00', 5, NULL, NULL, 'Declined partnership', 'Gabriel rejected Lena''s partnership proposal. Her recorded shift ended at 21:14.'),
    (8010, 'lease', '2026-02-17 23:34:00', 6, 1, NULL, 'Lease dispute', 'Theo argued with Gabriel over rent, but dining-room footage covers him continuously from 21:24 until 21:58.'),
    (8011, 'billing', '2026-02-17 23:38:00', 7, NULL, NULL, 'Overdue invoices', 'Ruth was owed two invoices. Her first service-station entry occurred after the espresso had been collected.');

  COMMIT;
  `,
);

createDatabase(
  "the-blackthorn-ledger",
  `
  BEGIN;

  CREATE TABLE persons (
    person_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE
  );

  CREATE TABLE locations (
    location_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL CHECK (kind IN ('room', 'cell_sector')),
    district TEXT NOT NULL
  );

  CREATE TABLE badges (
    badge_id INTEGER PRIMARY KEY,
    badge_code TEXT NOT NULL UNIQUE,
    assigned_person_id INTEGER NOT NULL REFERENCES persons(person_id),
    active_from TEXT NOT NULL,
    active_until TEXT
  );

  CREATE TABLE access_events (
    access_event_id INTEGER PRIMARY KEY,
    badge_id INTEGER NOT NULL REFERENCES badges(badge_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    occurred_at TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('enter', 'exit')),
    result TEXT NOT NULL CHECK (result IN ('granted', 'denied'))
  );

  CREATE TABLE phone_calls (
    call_id INTEGER PRIMARY KEY,
    subscriber_person_id INTEGER NOT NULL REFERENCES persons(person_id),
    other_number TEXT NOT NULL,
    started_at TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
    origin_location_id INTEGER NOT NULL REFERENCES locations(location_id)
  );

  CREATE TABLE vendors (
    vendor_id INTEGER PRIMARY KEY,
    legal_name TEXT NOT NULL UNIQUE,
    registered_address TEXT NOT NULL,
    payout_account_ref TEXT NOT NULL
  );

  CREATE TABLE payments (
    payment_id INTEGER PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(vendor_id),
    approved_by_person_id INTEGER NOT NULL REFERENCES persons(person_id),
    invoice_number TEXT NOT NULL UNIQUE,
    paid_at TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    memo TEXT NOT NULL
  );

  CREATE TABLE equipment_items (
    item_id INTEGER PRIMARY KEY,
    asset_tag TEXT NOT NULL UNIQUE,
    item_type TEXT NOT NULL,
    display_name TEXT NOT NULL,
    power_source TEXT NOT NULL CHECK (power_source IN ('gasoline', 'electric', 'battery', 'manual')),
    home_location_id INTEGER NOT NULL REFERENCES locations(location_id)
  );

  CREATE TABLE equipment_loans (
    loan_id INTEGER PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES equipment_items(item_id),
    borrower_person_id INTEGER NOT NULL REFERENCES persons(person_id),
    checked_out_at TEXT NOT NULL,
    due_at TEXT NOT NULL,
    returned_at TEXT,
    purpose TEXT NOT NULL,
    CHECK (due_at >= checked_out_at),
    CHECK (returned_at IS NULL OR returned_at >= checked_out_at)
  );

  CREATE INDEX idx_access_location_time ON access_events(location_id, occurred_at, result, action);
  CREATE INDEX idx_payments_approver_time ON payments(approved_by_person_id, paid_at);
  CREATE INDEX idx_loans_time ON equipment_loans(item_id, checked_out_at, returned_at);

  INSERT INTO persons VALUES
    (1, 'Elias Rook', 'trust auditor', '555-0101'),
    (2, 'Mara Voss', 'finance director', '555-0102'),
    (3, 'Calder Wynn', 'facilities supervisor', '555-0103'),
    (4, 'Nina Saye', 'senior archivist', '555-0104'),
    (5, 'Julian Cross', 'procurement officer', '555-0105'),
    (6, 'Theo Bell', 'night guard', '555-0106'),
    (7, 'Lena Orr', 'deputy controller', '555-0107');

  INSERT INTO locations VALUES
    (1, 'Blackthorn Trust Lobby', 'room', 'Blackthorn'),
    (2, 'Records Archive', 'room', 'Blackthorn'),
    (3, 'Archive Service Level', 'room', 'Blackthorn'),
    (4, 'Equipment Cage', 'room', 'Blackthorn'),
    (5, 'Finance Office', 'room', 'Blackthorn'),
    (6, 'Procurement Office', 'room', 'Blackthorn'),
    (7, 'Blackthorn Cell', 'cell_sector', 'Blackthorn'),
    (8, 'West Ferry Cell', 'cell_sector', 'West Docks'),
    (9, 'South Tram Cell', 'cell_sector', 'South Ward'),
    (10, 'Lantern Cafe Cell', 'cell_sector', 'Lantern Quarter');

  INSERT INTO badges VALUES
    (101, 'BT-R17', 1, '2026-01-01 00:00:00', NULL),
    (102, 'BT-F04', 2, '2026-01-01 00:00:00', NULL),
    (103, 'BT-M02', 3, '2026-01-01 00:00:00', NULL),
    (104, 'BT-A11', 4, '2026-01-01 00:00:00', NULL),
    (105, 'BT-P09', 5, '2026-01-01 00:00:00', NULL),
    (106, 'BT-S01', 6, '2026-01-01 00:00:00', NULL),
    (107, 'BT-C03', 7, '2026-01-01 00:00:00', NULL);

  INSERT INTO access_events VALUES
    (1001, 102, 1, '2026-10-17 17:25:00', 'enter', 'granted'),
    (1002, 102, 4, '2026-10-17 17:31:00', 'enter', 'granted'),
    (1003, 102, 4, '2026-10-17 17:36:00', 'exit', 'granted'),
    (1004, 102, 1, '2026-10-17 17:40:00', 'exit', 'granted'),
    (1005, 102, 1, '2026-10-17 21:40:00', 'enter', 'granted'),
    (1006, 102, 5, '2026-10-17 21:42:00', 'enter', 'granted'),
    (1007, 102, 5, '2026-10-17 21:46:00', 'exit', 'granted'),
    (1008, 102, 3, '2026-10-17 21:48:00', 'enter', 'granted'),
    (1009, 102, 3, '2026-10-17 22:02:00', 'exit', 'granted'),
    (1010, 102, 1, '2026-10-17 22:08:00', 'exit', 'granted'),
    (1011, 103, 1, '2026-10-17 18:00:00', 'enter', 'granted'),
    (1012, 103, 4, '2026-10-17 18:07:00', 'enter', 'granted'),
    (1013, 103, 4, '2026-10-17 18:13:00', 'exit', 'granted'),
    (1014, 103, 3, '2026-10-17 20:54:00', 'enter', 'granted'),
    (1015, 103, 3, '2026-10-17 21:18:00', 'exit', 'granted'),
    (1016, 103, 1, '2026-10-17 21:25:00', 'exit', 'granted'),
    (1017, 104, 1, '2026-10-17 18:57:00', 'enter', 'granted'),
    (1018, 104, 4, '2026-10-17 19:02:00', 'enter', 'granted'),
    (1019, 104, 4, '2026-10-17 19:07:00', 'exit', 'granted'),
    (1020, 104, 2, '2026-10-17 21:20:00', 'enter', 'granted'),
    (1021, 104, 2, '2026-10-17 21:34:00', 'exit', 'granted'),
    (1022, 104, 1, '2026-10-17 21:36:00', 'exit', 'granted'),
    (1023, 105, 1, '2026-10-17 19:58:00', 'enter', 'granted'),
    (1024, 105, 4, '2026-10-17 20:02:00', 'enter', 'granted'),
    (1025, 105, 4, '2026-10-17 20:08:00', 'exit', 'granted'),
    (1026, 105, 6, '2026-10-17 20:10:00', 'enter', 'granted'),
    (1027, 105, 6, '2026-10-17 21:50:00', 'exit', 'granted'),
    (1028, 105, 3, '2026-10-17 21:51:00', 'enter', 'granted'),
    (1029, 105, 3, '2026-10-17 22:03:00', 'exit', 'granted'),
    (1030, 105, 1, '2026-10-17 22:10:00', 'exit', 'granted'),
    (1031, 106, 1, '2026-10-17 21:30:00', 'enter', 'granted'),
    (1032, 106, 3, '2026-10-17 21:54:00', 'enter', 'granted'),
    (1033, 106, 3, '2026-10-17 21:57:00', 'exit', 'granted'),
    (1034, 106, 2, '2026-10-17 22:17:00', 'enter', 'granted'),
    (1035, 106, 2, '2026-10-17 22:23:00', 'exit', 'granted'),
    (1036, 101, 1, '2026-10-17 21:32:00', 'enter', 'granted'),
    (1037, 101, 2, '2026-10-17 21:38:00', 'enter', 'granted'),
    (1038, 107, 5, '2026-10-17 16:10:00', 'enter', 'granted'),
    (1039, 107, 5, '2026-10-17 18:48:00', 'exit', 'granted'),
    (1040, 107, 1, '2026-10-17 18:51:00', 'exit', 'granted');

  INSERT INTO phone_calls VALUES
    (4001, 1, '555-0198', '2026-10-17 21:31:00', 84, 7),
    (4002, 2, '555-0188', '2026-10-17 21:43:12', 44, 7),
    (4003, 3, '555-0171', '2026-10-17 21:42:30', 1530, 8),
    (4004, 4, '555-0166', '2026-10-17 21:46:00', 1260, 9),
    (4005, 5, '555-0155', '2026-10-17 21:55:10', 37, 7),
    (4006, 6, '555-0144', '2026-10-17 22:05:00', 96, 7),
    (4007, 2, '555-0120', '2026-10-17 22:14:00', 481, 10),
    (4008, 7, '555-0132', '2026-10-17 21:49:00', 930, 9);

  INSERT INTO vendors VALUES
    (201, 'Darrow Paper & Bindery', '8 Mill Street', 'PX-1182'),
    (202, 'North Quay Advisory', 'PO Box 118, Blackthorn', 'PX-9044'),
    (203, 'Vale & Ash Preservation', 'PO Box 118, Blackthorn', 'PX-9044'),
    (204, 'Harbor Glassworks', '41 Dock Road', 'PX-5520'),
    (205, 'Orison Mechanical', '3 Foundry Row', 'PX-1830'),
    (206, 'Nightjar Security', '77 Market Street', 'PX-6602'),
    (207, 'Nightjar Monitoring', '77 Market Street', 'PX-6602');

  INSERT INTO payments VALUES
    (3001, 202, 2, 'NQA-104', '2026-04-14 10:00:00', 2840000, 'Digitization phase I'),
    (3002, 203, 2, 'VAP-208', '2026-06-30 10:00:00', 3170000, 'Preservation survey'),
    (3003, 202, 2, 'NQA-119', '2026-09-22 10:00:00', 3450000, 'Digitization phase II'),
    (3004, 205, 2, 'ORI-881', '2026-07-08 10:00:00', 1280000, 'Boiler service'),
    (3005, 204, 5, 'HG-552', '2026-03-19 10:00:00', 6200000, 'Atrium glazing'),
    (3006, 201, 5, 'DP-440', '2026-08-03 10:00:00', 4250000, 'Archive stock'),
    (3007, 206, 7, 'NS-210', '2026-02-10 10:00:00', 3200000, 'Guarding contract'),
    (3008, 207, 7, 'NM-044', '2026-05-10 10:00:00', 3100000, 'Alarm monitoring'),
    (3009, 206, 7, 'NS-233', '2026-08-10 10:00:00', 3200000, 'Guarding contract');

  INSERT INTO equipment_items VALUES
    (401, 'EQ-017', 'utility_pump', 'Compact utility pump', 'gasoline', 4),
    (402, 'EQ-022', 'utility_pump', 'Electric transfer pump', 'electric', 4),
    (403, 'EQ-031', 'air_mover', 'Carpet air mover', 'electric', 4),
    (404, 'EQ-008', 'generator', 'Portable generator', 'gasoline', 4),
    (405, 'EQ-046', 'utility_pump', 'Site utility pump', 'gasoline', 4);

  INSERT INTO equipment_loans VALUES
    (501, 401, 2, '2026-10-17 17:33:00', '2026-10-18 09:00:00', '2026-10-18 07:12:00', 'Courtyard drain test'),
    (502, 405, 3, '2026-10-17 18:10:00', '2026-10-18 09:00:00', '2026-10-18 08:05:00', 'West Ferry sump test'),
    (503, 403, 4, '2026-10-17 19:05:00', '2026-10-18 09:00:00', '2026-10-18 08:15:00', 'Dry archive alcove carpet'),
    (504, 402, 5, '2026-10-17 20:05:00', '2026-10-18 09:00:00', '2026-10-18 07:40:00', 'Condensate transfer'),
    (505, 404, 6, '2026-10-12 08:30:00', '2026-10-12 17:00:00', '2026-10-12 16:44:00', 'Emergency-light test');

  COMMIT;
  `,
);

createDatabase(
  "midnight-at-pier-nine",
  `
  BEGIN;

  CREATE TABLE people (
    person_id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL UNIQUE,
    occupation TEXT NOT NULL,
    life_status TEXT NOT NULL CHECK (life_status IN ('alive', 'deceased'))
  );

  CREATE TABLE person_aliases (
    alias_id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES people(person_id),
    alias TEXT NOT NULL COLLATE NOCASE,
    alias_type TEXT NOT NULL,
    UNIQUE (alias, alias_type)
  );

  CREATE TABLE locations (
    location_id INTEGER PRIMARY KEY,
    parent_location_id INTEGER REFERENCES locations(location_id),
    location_code TEXT NOT NULL UNIQUE,
    location_name TEXT NOT NULL,
    location_type TEXT NOT NULL
  );

  CREATE TABLE credentials (
    credential_id INTEGER PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES people(person_id),
    credential_code TEXT NOT NULL UNIQUE,
    issued_at TEXT NOT NULL,
    revoked_at TEXT,
    auth_mode TEXT NOT NULL
  );

  CREATE TABLE access_events (
    access_event_id INTEGER PRIMARY KEY,
    credential_id INTEGER NOT NULL REFERENCES credentials(credential_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    occurred_at TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT')),
    outcome TEXT NOT NULL CHECK (outcome IN ('GRANTED', 'DENIED')),
    verification TEXT NOT NULL
  );

  CREATE TABLE inventory_items (
    item_id INTEGER PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    item_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    controlled INTEGER NOT NULL CHECK (controlled IN (0, 1))
  );

  CREATE TABLE inventory_movements (
    movement_id INTEGER PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES inventory_items(item_id),
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    credential_id INTEGER NOT NULL REFERENCES credentials(credential_id),
    occurred_at TEXT NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('OUT', 'IN')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reference TEXT NOT NULL
  );

  CREATE TABLE devices (
    device_id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES locations(location_id),
    device_code TEXT NOT NULL UNIQUE,
    device_type TEXT NOT NULL
  );

  CREATE TABLE device_events (
    device_event_id INTEGER PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(device_id),
    actor_credential_id INTEGER REFERENCES credentials(credential_id),
    occurred_at TEXT NOT NULL,
    event_type TEXT NOT NULL,
    text_value TEXT,
    numeric_value REAL
  );

  CREATE TABLE communications (
    communication_id INTEGER PRIMARY KEY,
    sender_person_id INTEGER REFERENCES people(person_id),
    recipient_person_id INTEGER REFERENCES people(person_id),
    sent_at TEXT NOT NULL,
    channel TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    CHECK (sender_person_id IS NOT NULL OR recipient_person_id IS NOT NULL)
  );

  CREATE INDEX idx_access_time ON access_events(occurred_at, location_id);
  CREATE INDEX idx_inventory_time ON inventory_movements(occurred_at, item_id);
  CREATE INDEX idx_device_time ON device_events(occurred_at, device_id);
  CREATE INDEX idx_comms_sender_time ON communications(sender_person_id, sent_at);

  INSERT INTO people VALUES
    (1, 'Dr. Mara Vale', 'Founder of Aster House', 'deceased'),
    (2, 'Celia Rook', 'Harbor compliance auditor', 'alive'),
    (3, 'Elias Venn', 'Port security chief', 'alive'),
    (4, 'Dr. Ivo Mercer', 'Aster clinic physician', 'alive'),
    (5, 'Naomi Serrin', 'Vale legal counsel', 'alive'),
    (6, 'Tomas Quill', 'Refrigeration electrician', 'alive'),
    (7, 'Lena Ash', 'Municipal records archivist', 'alive'),
    (8, 'Owen Dace', 'Night watch officer', 'alive'),
    (9, 'Rowan Beck', 'Aster night nurse', 'alive'),
    (10, 'Iris Holt', 'Former Aster resident', 'deceased');

  INSERT INTO person_aliases VALUES
    (201, 2, 'LARK-09', 'Aster subject code'),
    (202, 10, 'LARK-08', 'Aster subject code'),
    (203, 1, 'M. VOSS', 'former legal name'),
    (204, 3, 'EV-07', 'radio handle'),
    (205, 4, 'MERCER, I.', 'billing name'),
    (206, 5, 'N. SERRIN', 'filing name'),
    (207, 6, 'TQ-18', 'contractor code'),
    (208, 7, 'L. ASH', 'archive account'),
    (209, 8, 'OD-31', 'radio handle'),
    (210, 9, 'R. BECK', 'clinical account');

  INSERT INTO locations VALUES
    (1, NULL, 'HARBOR', 'Meridian Harbor', 'site'),
    (2, 1, 'P9', 'Pier Nine', 'pier'),
    (3, 2, 'P9_GATE', 'Pier Nine Gate', 'checkpoint'),
    (4, 2, 'N9_VEST', 'N-9 Service Vestibule', 'checkpoint'),
    (5, 4, 'N9_CHAMBER', 'Controlled-Atmosphere Chamber N-9', 'chamber'),
    (6, 2, 'C8_CHAMBER', 'Controlled-Atmosphere Chamber C-8', 'chamber'),
    (7, NULL, 'ASTER', 'Aster Clinic Annex', 'site'),
    (8, 7, 'ASTER_ANNEX', 'Aster Staff Entrance', 'checkpoint'),
    (9, 7, 'ASTER_LOCKER', 'Controlled Medicine Locker', 'storage'),
    (10, 1, 'SECURITY', 'Harbor Security Office', 'office'),
    (11, NULL, 'CITY_ARCHIVE', 'Municipal Records Archive', 'archive');

  INSERT INTO credentials VALUES
    (101, 1, 'AV-001', '2026-01-01T00:00:00', NULL, 'BADGE_PIN'),
    (102, 2, 'HC-442', '2026-01-01T00:00:00', NULL, 'BADGE_PIN'),
    (103, 3, 'PS-007', '2026-01-01T00:00:00', NULL, 'BADGE_PIN'),
    (104, 4, 'AC-014', '2026-01-01T00:00:00', NULL, 'BADGE_PIN'),
    (105, 5, 'VT-003', '2026-11-14T00:00:00', NULL, 'TEMP_BADGE'),
    (106, 6, 'CT-018', '2026-06-01T00:00:00', NULL, 'BADGE'),
    (107, 7, 'MA-005', '2026-01-01T00:00:00', NULL, 'BADGE'),
    (108, 8, 'PS-031', '2026-01-01T00:00:00', NULL, 'BADGE_PIN'),
    (109, 9, 'AC-022', '2026-01-01T00:00:00', NULL, 'BADGE_PIN');

  INSERT INTO access_events VALUES
    (1001, 102, 8, '2026-11-14T22:23:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1002, 102, 8, '2026-11-14T22:37:00', 'OUT', 'GRANTED', 'BADGE'),
    (1003, 102, 3, '2026-11-14T23:30:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1004, 102, 4, '2026-11-14T23:44:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1005, 102, 4, '2026-11-15T00:10:00', 'OUT', 'GRANTED', 'BADGE'),
    (1006, 102, 3, '2026-11-15T00:12:00', 'OUT', 'GRANTED', 'BADGE'),
    (1010, 101, 3, '2026-11-14T23:34:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1011, 101, 4, '2026-11-14T23:42:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1020, 103, 8, '2026-11-14T21:39:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1021, 103, 8, '2026-11-14T21:56:00', 'OUT', 'GRANTED', 'BADGE'),
    (1022, 103, 3, '2026-11-14T22:44:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1023, 103, 4, '2026-11-14T22:47:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1024, 103, 4, '2026-11-14T22:52:00', 'OUT', 'GRANTED', 'BADGE'),
    (1025, 103, 3, '2026-11-14T22:54:00', 'OUT', 'GRANTED', 'BADGE'),
    (1030, 104, 8, '2026-11-14T20:52:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1031, 104, 8, '2026-11-14T21:31:00', 'OUT', 'GRANTED', 'BADGE'),
    (1032, 104, 3, '2026-11-14T23:28:00', 'IN', 'DENIED', 'NO_CLEARANCE'),
    (1040, 105, 3, '2026-11-14T22:04:00', 'IN', 'GRANTED', 'ESCORT'),
    (1041, 105, 3, '2026-11-14T22:21:00', 'OUT', 'GRANTED', 'ESCORT'),
    (1050, 106, 3, '2026-11-14T23:19:00', 'IN', 'GRANTED', 'BADGE'),
    (1051, 106, 6, '2026-11-14T23:23:00', 'IN', 'GRANTED', 'BADGE'),
    (1052, 106, 6, '2026-11-15T00:05:00', 'OUT', 'GRANTED', 'BADGE'),
    (1053, 106, 3, '2026-11-15T00:07:00', 'OUT', 'GRANTED', 'BADGE'),
    (1060, 107, 3, '2026-11-14T23:36:00', 'IN', 'DENIED', 'NO_CLEARANCE'),
    (1070, 108, 3, '2026-11-15T00:15:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1071, 108, 4, '2026-11-15T00:16:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1080, 109, 8, '2026-11-14T22:55:00', 'IN', 'GRANTED', 'PIN_OK'),
    (1081, 109, 8, '2026-11-15T06:55:00', 'OUT', 'GRANTED', 'BADGE');

  INSERT INTO inventory_items VALUES
    (501, 'S17-VIAL', 'S-17 clinical sedative', 'vial', 1),
    (502, 'FUSE-20A', 'Atmosphere controller safety fuse', 'unit', 0),
    (503, 'OVERRIDE-KEY', 'Chamber mechanical override key', 'key', 1),
    (504, 'ARCHIVE-REEL', 'Aster audio archive cartridge', 'cartridge', 1);

  INSERT INTO inventory_movements VALUES
    (7001, 501, 9, 104, '2026-11-14T21:05:00', 'OUT', 1, 'Ward review'),
    (7002, 501, 9, 104, '2026-11-14T21:24:00', 'IN', 1, 'Unused return'),
    (7003, 501, 9, 102, '2026-11-14T22:29:00', 'OUT', 2, 'Compliance recount QA-19'),
    (7004, 501, 9, 109, '2026-11-14T23:02:00', 'OUT', 1, 'Prescription RX-441'),
    (7005, 503, 10, 103, '2026-11-14T22:42:00', 'OUT', 1, 'N-9 inspection'),
    (7006, 503, 10, 103, '2026-11-14T22:57:00', 'IN', 1, 'Inspection complete'),
    (7007, 502, 10, 106, '2026-11-14T23:12:00', 'OUT', 1, 'C-8 work order'),
    (7008, 502, 10, 106, '2026-11-15T00:09:00', 'IN', 1, 'Failed fuse return'),
    (7009, 504, 11, 107, '2026-11-14T19:10:00', 'OUT', 1, 'SESSION-14 inspection'),
    (7010, 504, 11, 107, '2026-11-14T19:32:00', 'IN', 1, 'Inspection refused');

  INSERT INTO devices VALUES
    (301, 5, 'N9-ATM', 'atmosphere controller'),
    (302, 5, 'N9-LOCK', 'occupancy interlock'),
    (303, 5, 'N9-AUDIO', 'archive audio terminal'),
    (304, 6, 'C8-ATM', 'atmosphere controller'),
    (305, 6, 'C8-LOCK', 'occupancy interlock');

  INSERT INTO device_events VALUES
    (8001, 302, 103, '2026-11-14T22:48:00', 'INTERLOCK_DIAGNOSTIC', 'PASS', NULL),
    (8002, 301, 103, '2026-11-14T22:49:00', 'PURGE_TEST', 'PASS', NULL),
    (8003, 305, 106, '2026-11-14T23:25:00', 'SAFETY_BYPASS', 'SERVICE_MODE', NULL),
    (8004, 304, 106, '2026-11-14T23:27:00', 'PURGE_TEST', 'PASS', NULL),
    (8005, 302, 102, '2026-11-14T23:47:00', 'SAFETY_BYPASS', 'OCCUPANCY_SENSOR', NULL),
    (8006, 301, 102, '2026-11-14T23:49:00', 'PURGE_START', 'INERT_ATMOSPHERE', NULL),
    (8007, 303, 102, '2026-11-14T23:51:00', 'PLAY_ARCHIVE', 'LARK-09/SESSION-14', NULL),
    (8008, 301, NULL, '2026-11-14T23:57:00', 'O2_PERCENT', NULL, 8.4),
    (8009, 301, NULL, '2026-11-15T00:04:00', 'O2_PERCENT', NULL, 3.1),
    (8010, 301, NULL, '2026-11-15T00:11:00', 'PURGE_STOP', 'AUTOMATIC_LIMIT', NULL),
    (8011, 302, 108, '2026-11-15T00:16:00', 'EMERGENCY_RELEASE', 'WATCH_OVERRIDE', NULL);

  INSERT INTO communications VALUES
    (9001, 1, 7, '2026-11-14T18:42:00', 'email', 'Midnight', 'At midnight the Aster recordings go to the trustees. LARK-09 is alive, and SESSION-14 is the voice that will make them pay. Bring it to Pier Nine.'),
    (9002, 1, 5, '2026-11-14T20:06:00', 'message', 'Settlement', 'Once LARK-09 is named, the trustees will purchase silence. Meet me after midnight; the survivor never needs to know who heard her.'),
    (9003, 1, 7, '2026-11-14T17:55:00', 'email', 'Old files', 'Keep LARK-08 sealed. One dead witness is sentiment; a living one is leverage.'),
    (9004, 3, 1, '2026-11-14T22:35:00', 'message', 'Inspection', 'Your claim about falsified inspections is false. I will test N-9 before 23:00, and then this ends.'),
    (9005, 4, 1, '2026-11-14T21:12:00', 'message', 'Ledger', 'If you send the controlled-drug ledger, I lose my license. I will not keep paying for your silence.'),
    (9006, 5, 1, '2026-11-14T20:11:00', 'email', 'Injunction', 'Publishing a survivor identity is abuse, not disclosure. I am seeking an injunction tonight.'),
    (9007, 6, 8, '2026-11-14T23:40:00', 'radio_text', 'C-8', 'C-8 purge test is stable. I am replacing its fuse and staying clear of N-9.'),
    (9008, 7, 1, '2026-11-14T19:01:00', 'message', 'SESSION-14', 'I will not bring SESSION-14. You are turning a child terror into currency again.'),
    (9009, 1, 3, '2026-11-14T21:58:00', 'message', 'Board', 'At dawn the board receives your inspection edits unless you sign the transfer.'),
    (9010, 1, 4, '2026-11-14T20:44:00', 'message', 'Drug ledger', 'The drug ledger buys me more than your apology. Have the money ready by morning.');

  COMMIT;
  `,
);

createDatabase(
  "manor",
  `
CREATE TABLE guests (
id          INTEGER PRIMARY KEY,
name        TEXT,
room        TEXT,
floor       INTEGER,
hair_color  TEXT,
accessory   TEXT
);
CREATE TABLE staff (
id     INTEGER PRIMARY KEY,
name   TEXT,
role   TEXT,
floor  INTEGER,
alibi  TEXT
);
CREATE TABLE crime_scene_report (
id      INTEGER PRIMARY KEY,
officer TEXT,
report  TEXT
);
CREATE TABLE interviews (
id         INTEGER PRIMARY KEY,
person     TEXT,
statement  TEXT
);
INSERT INTO guests (id, name, room, floor, hair_color, accessory) VALUES
(1,  'Reginald Ashworth',   '204', 2, 'red',    'pocket watch'),
(2,  'Cordelia Vane',       '303', 3, 'red',    'monocle'),
(3,  'Percival Finch',      '105', 1, 'red',    'monocle'),
(4,  'Victoria Pemberton',  '212', 2, 'red',    'monocle'),
(5,  'Arthur Blythe',       '207', 2, 'black',  'monocle'),
(6,  'Josephine Marsh',     '201', 2, 'red',    'pearl necklace'),
(7,  'Edmund Croft',        '209', 2, 'grey',   'signet ring'),
(8,  'Wilhelmina Fenwick',  '104', 1, 'blonde', 'ivory fan'),
(9,  'Chester Dunmore',     '108', 1, 'black',  'silver cane'),
(10, 'Adelaide Rowntree',   '301', 3, 'grey',   'lace gloves'),
(11, 'Bartholomew Quill',   '302', 3, 'blonde', 'pocket watch'),
(12, 'Henrietta Salt',      '305', 3, 'black',  'brooch');
INSERT INTO staff (id, name, role, floor, alibi) VALUES
(1, 'Mr. Chen',      'butler',   1, 'locking up the cellar until 11:30pm, with the cook'),
(2, 'Ingrid Larsen', 'maid',     3, 'turning down beds on the third floor all evening'),
(3, 'Marta Dowd',    'cook',     1, 'kitchen from 8pm, baking for the morning, with Mr. Chen'),
(4, 'Old Tam',       'gardener', 1, 'off the grounds since dusk, storm being what it was');
INSERT INTO crime_scene_report (id, officer, report) VALUES
(1, 'Sgt. Okonkwo',
'Body of Lord Havisham found in the library at 11:05pm. Estimated time of death 10:15pm. The library is reached only from the second-floor corridor.'),
(2, 'Sgt. Okonkwo',
'Physical evidence: several long RED hairs clutched in the victim''s hand, and a silver monocle chain snagged on the library ladder.'),
(3, 'Insp. Reyes',
'Witness summary: the suspect was seen fleeing along the SECOND-FLOOR corridor at about 10:20pm. Red hair, monocle glinting in the candlelight. Guests only - staff uniforms are navy and were accounted for.');
INSERT INTO interviews (id, person, statement) VALUES
(1,  'Mr. Chen',
'I heard a commotion above the library ceiling at just past ten. The storm covered most of it, my lord.'),
(2,  'Ingrid Larsen',
'I was making up the third floor. I did hear footsteps on the stairs, but half the house was awake with the thunder.'),
(3,  'Marta Dowd',
'Mr. Chen and I were elbow-deep in dough the whole evening. Neither of us went above stairs.'),
(4,  'Old Tam',
'I was in my cottage. The storm would have drowned out a cannon.'),
(5,  'Reginald Ashworth',
'Reading in my room the entire time. My watch stopped at ten, curse the damp.'),
(6,  'Cordelia Vane',
'I retired early. Whatever happened on the second floor, it was nobody from the third, I assure you.'),
(7,  'Percival Finch',
'I never left the first floor. My knee gives out on staircases, ask anyone.'),
(8,  'Victoria Pemberton',
'I was... in my room. Composing a letter. I heard nothing at all. Nothing.'),
(9,  'Arthur Blythe',
'I heard a monocle chain jingle past my door. Very distinctive, that little chime. Whoever it was came from the east wing.'),
(10, 'Josephine Marsh',
'The wallpaper in my room is red, if that helps. I say, you are not suggesting it was me?'),
(11, 'Edmund Croft',
'A woman in a hurry passed me in the corridor. Red hair, I think. I did not note the face.'),
(12, 'Wilhelmina Fenwick',
'One does not linger in corridors during a storm. I was abed before ten.'),
(13, 'Chester Dunmore',
'My cane and I were in the smoking room, first floor, all night. The staff will confirm.'),
(14, 'Adelaide Rowntree',
'We heard it all from the third floor. Or rather, we heard the storm and then we heard the scream.'),
(15, 'Bartholomew Quill',
'I write at night, but only by the window on the third floor. I saw a candle moving on the second-floor walk, going east.'),
(16, 'Henrietta Salt',
'I was playing patience in my room. The cards said nothing good was coming, and they were right.');

  `,
);

createDatabase(
  "thesis",
  `
CREATE TABLE students (
id       INTEGER PRIMARY KEY,
name     TEXT,
program  TEXT,
card_id  TEXT
);
CREATE TABLE lab_access (
id      INTEGER PRIMARY KEY,
card_id TEXT,
lab     TEXT,
entry   TEXT,
exit    TEXT
);
CREATE TABLE print_jobs (
id        INTEGER PRIMARY KEY,
card_id   TEXT,
printer   TEXT,
ts        TEXT,
pages     INTEGER,
document  TEXT
);
CREATE TABLE incident_log (
id       INTEGER PRIMARY KEY,
event    TEXT,
details  TEXT
);
INSERT INTO students (id, name, program, card_id) VALUES
(1,  'Sofia Lindqvist',  'MSc Informatics',   'L-0388'),
(2,  'Marcus Tan',       'MSc Informatics',   'L-0447'),
(3,  'Amina Haddad',     'MSc Data Science',  'L-0501'),
(4,  'Jonas Petersen',   'BSc Informatics',   'L-0512'),
(5,  'Elif Kaya',        'MSc Data Science',  'L-0601'),
(6,  'Petter Dahl',      'BSc Informatics',   'L-0390'),
(7,  'Ingrid Storm',     'MSc Informatics',   'L-0455'),
(8,  'Kwame Mensah',     'PhD Informatics',   'L-0210'),
(9,  'Linnea Holm',      'BSc Data Science',  'L-0554'),
(10, 'Diego Fuentes',    'MSc Informatics',   'L-0620');
INSERT INTO lab_access (id, card_id, lab, entry, exit) VALUES
(1,  'L-0447', 'A-01', '2025-05-02 22:10', '2025-05-03 01:45'),
(2,  'L-0512', 'C-07', '2025-05-02 21:30', '2025-05-03 00:15'),
(3,  'L-0501', 'A-01', '2025-05-02 23:00', '2025-05-03 02:00'),
(4,  'L-0388', 'B-12', '2025-05-03 02:31', '2025-05-03 02:58'),
(5,  'L-0601', 'D-02', '2025-05-03 00:15', '2025-05-03 03:30'),
(6,  'L-0210', 'C-07', '2025-05-03 01:00', '2025-05-03 04:10'),
(7,  'L-0390', 'A-01', '2025-05-02 20:00', '2025-05-02 22:30'),
(8,  'L-0455', 'A-01', '2025-05-03 02:05', '2025-05-03 03:40'),
(9,  'L-0554', 'D-02', '2025-05-03 02:20', '2025-05-03 02:50'),
(10, 'L-0620', 'A-01', '2025-05-02 19:30', '2025-05-02 21:00'),
(11, 'L-0447', 'A-01', '2025-05-03 08:00', '2025-05-03 09:30'),
(12, 'L-0388', 'A-01', '2025-05-02 16:00', '2025-05-02 17:00'),
(13, 'L-0501', 'B-12', '2025-05-01 14:00', '2025-05-01 15:00'),
(14, 'L-0210', 'D-02', '2025-05-01 10:00', '2025-05-01 12:00');
INSERT INTO print_jobs (id, card_id, printer, ts, pages, document) VALUES
(1,  'L-0388', 'STAIRWELL-2', '2025-05-03 03:12', 1,  'thesis_cover_template.pdf'),
(2,  'L-0447', 'READING-1',   '2025-05-03 01:50', 12, 'ch8_draft.pdf'),
(3,  'L-0601', 'MAKERSPACE',  '2025-05-03 03:05', 2,  'gear_diagram_v3.png'),
(4,  'L-0210', 'CHEM-CORR',   '2025-05-03 03:40', 24, 'assay_results_may.xlsx'),
(5,  'L-0501', 'READING-1',   '2025-05-03 01:30', 3,  'cv_linnea_notes.txt'),
(6,  'L-0455', 'READING-1',   '2025-05-03 03:15', 6,  'slides_defense_draft.pdf'),
(7,  'L-0512', 'CHEM-CORR',   '2025-05-02 23:50', 5,  'lab7_report.docx'),
(8,  'L-0554', 'MAKERSPACE',  '2025-05-03 02:45', 1,  'badge_template.svg'),
(9,  'L-0390', 'READING-1',   '2025-05-02 22:10', 8,  'exam_review.pdf'),
(10, 'L-0620', 'READING-1',   '2025-05-02 20:40', 2,  'ticket_poster.pdf'),
(11, 'L-0447', 'READING-1',   '2025-05-03 08:10', 1,  'thesis_receipt.pdf');
INSERT INTO incident_log (id, event, details) VALUES
(1, '2025-05-03 02:31',
'Forced entry detected at thesis office B-12. The printed original of the thesis and its backup drive are missing. Door lock shows no valid card swipe - the card reader log for B-12 was pulled for the night.'),
(2, '2025-05-03 03:12',
'Night guard reports the STAIRWELL-2 printer light on. A figure in a lab coat collected a single page and left towards the east exit. The figure carried a folder.'),
(3, '2025-05-03 09:00',
'Registrar confirms B-12 had no bookings that night. The office belongs to the informatics department; only informatics and data science cards open the corridor doors.'),
(4, '2025-05-03 10:00',
'Suspicious detail: a fresh cover page, printed on department paper stock, was found in the recycling bin outside B-12. It looks like someone prepared a decoy.');

  `,
);

createDatabase(
  "coffee",
  `
CREATE TABLE people (
id    INTEGER PRIMARY KEY,
name  TEXT,
role  TEXT
);
CREATE TABLE coffee_orders (
id          INTEGER PRIMARY KEY,
person_id   INTEGER,
drink       TEXT,
milk        TEXT,
ts          TEXT
);
CREATE TABLE kitchen_duty (
id          INTEGER PRIMARY KEY,
person_id   INTEGER,
weekday     TEXT
);
CREATE TABLE purchases (
id           INTEGER PRIMARY KEY,
person_id    INTEGER,
item         TEXT,
store        TEXT,
ts           TEXT
);
INSERT INTO people (id, name, role) VALUES
(1,  'Harold Kane',      'professor'),
(2,  'Marta Ilves',      'laboratory technician'),
(3,  'Dev Patel',        'PhD candidate'),
(4,  'Bram Willems',     'groundskeeper'),
(5,  'Astrid Nilsen',    'associate professor'),
(6,  'Tomasz Nowak',     'PhD candidate'),
(7,  'Grace Okafor',     'department secretary'),
(8,  'Viktor Sund',      'MSc student'),
(9,  'Bea Lindgren',     'associate professor'),
(10, 'Ravi Chandran',    'MSc student');
INSERT INTO coffee_orders (id, person_id, drink, milk, ts) VALUES
(1,  1,  'flat white',   'oat',     '2025-05-16 08:42'),
(2,  3,  'filter',       'none',    '2025-05-16 08:15'),
(3,  5,  'latte',        'regular', '2025-05-16 08:20'),
(4,  7,  'espresso',     'none',    '2025-05-16 08:25'),
(5,  8,  'latte',        'regular', '2025-05-16 08:31'),
(6,  2,  'black',        'none',    '2025-05-16 08:35'),
(7,  9,  'cappuccino',   'regular', '2025-05-16 08:37'),
(8,  10, 'filter',       'none',    '2025-05-16 08:40'),
(9,  4,  'thermos fill', 'none',    '2025-05-16 07:50'),
(10, 6,  'latte',        'soy',     '2025-05-16 08:44'),
(11, 1,  'flat white',   'oat',     '2025-05-15 08:40'),
(12, 5,  'latte',        'regular', '2025-05-15 08:22'),
(13, 2,  'black',        'none',    '2025-05-15 08:36'),
(14, 9,  'cappuccino',   'regular', '2025-05-15 08:38'),
(15, 3,  'filter',       'none',    '2025-05-15 08:12');
INSERT INTO kitchen_duty (id, person_id, weekday) VALUES
(1,  7,  'Monday'),
(2,  3,  'Tuesday'),
(3,  6,  'Tuesday'),
(4,  8,  'Wednesday'),
(5,  9,  'Wednesday'),
(6,  2,  'Thursday'),
(7,  3,  'Thursday'),
(8,  5,  'Thursday'),
(9,  10, 'Friday'),
(10, 4,  'Saturday'),
(11, 6,  'Sunday'),
(12, 8,  'Monday'),
(13, 10, 'Tuesday'),
(14, 5,  'Wednesday'),
(15, 7,  'Friday');
INSERT INTO purchases (id, person_id, item, store, ts) VALUES
(1,  2,  'RatX rodenticide pellets',   'GreenLeaf Garden Supply', '2025-05-08 17:20'),
(2,  4,  'RatX rodenticide pellets',   'GreenLeaf Garden Supply', '2025-05-05 12:45'),
(3,  3,  'humane live mouse trap',     'Byggsentret Hardware',   '2025-05-06 10:10'),
(4,  5,  'printer paper, 2 reams',     'Campus Bookstore',       '2025-05-07 09:30'),
(5,  7,  'dish soap + sponges',        'Rema 1000',              '2025-05-09 16:05'),
(6,  8,  'espresso beans 1kg',         'Kaffebar Botanisk',      '2025-05-12 14:40'),
(7,  9,  'oat milk, 6-pack',           'Rema 1000',              '2025-05-13 18:22'),
(8,  6,  'soy milk carton',            'Rema 1000',              '2025-05-14 08:15'),
(9,  10, 'bike inner tube',            'Sykkelservice Vest',     '2025-05-11 11:00'),
(10, 1,  'black coffee beans 250g',    'Kaffebar Botanisk',      '2025-05-14 15:30'),
(11, 4,  'hedge shears',               'Byggsentret Hardware',   '2025-05-13 13:10'),
(12, 2,  'rubber gloves',              'Rema 1000',              '2025-05-09 18:44'),
(13, 5,  'whiteboard markers',         'Campus Bookstore',       '2025-05-15 10:25'),
(14, 3,  'USB-C cable',                'Campus Bookstore',       '2025-05-15 12:50'),
(15, 7,  'kitchen foil + cling wrap',  'Rema 1000',              '2025-05-14 17:35');

  `,
);

createDatabase(
  "nordkapp-fjord",
  `
CREATE TABLE suspects (
id INTEGER PRIMARY KEY,
name TEXT NOT NULL,
hometown TEXT NOT NULL,
occupation TEXT NOT NULL,
boat_name TEXT NOT NULL,
boat_length_m REAL NOT NULL,
engine_type TEXT NOT NULL,
engine_hp INTEGER NOT NULL,
alibi TEXT NOT NULL
);
INSERT INTO suspects (id, name, hometown, occupation, boat_name, boat_length_m, engine_type, engine_hp, alibi) VALUES
(1, 'Karl Antonsen', 'Kjollefjord', 'fish trader', 'Skarven', 18, 'diesel', 420, 'At the fish auction until 21:00, then claims he went home'),
(2, 'Petter Lynge', 'Honningsvag', 'harbour master', 'Maken', 12, 'outboard petrol', 60, 'Working at the harbour office; logged out at 22:10'),
(3, 'Sigurd Eira', 'Mehamn', 'fisher', 'Eirabaten', 10, 'diesel', 180, 'Mending nets at the dock with his brother'),
(4, 'Lars Utsi', 'Kjollefjord', 'sled operator', 'Reinsdyret', 8, 'outboard petrol', 40, 'Guiding a night tour; returned at 23:30'),
(5, 'Magnus Olsen', 'Honningsvag', 'fisher', 'Havbris', 14, 'diesel', 260, 'Home with his family from 20:00'),
(6, 'Erik Finne', 'Mehamn', 'fish trader', 'Stormfugl', 22, 'diesel', 640, 'Claims engine trouble; moored in Mehamn all evening');
CREATE TABLE gps_pings (
id INTEGER PRIMARY KEY,
boat_name TEXT NOT NULL,
timestamp TEXT NOT NULL,
latitude REAL NOT NULL,
longitude REAL NOT NULL,
speed_knots REAL NOT NULL,
note TEXT NOT NULL
);
INSERT INTO gps_pings (id, boat_name, timestamp, latitude, longitude, speed_knots, note) VALUES
(1, 'Skarven', '2024-08-20 21:20:00', 70.9912, 25.771, 8.5, 'Leaving Kjollefjord'),
(2, 'Skarven', '2024-08-20 22:40:00', 71.0501, 25.9002, 9.1, 'Northbound along the coast'),
(3, 'Skarven', '2024-08-20 23:10:00', 71.1011, 25.9801, 2, 'Adrift in the barge lane; two minutes before impact'),
(4, 'Skarven', '2024-08-20 23:55:00', 71.13, 26.05, 4.8, 'Limping northeast; irregular engine speed'),
(5, 'Havbris', '2024-08-20 20:15:00', 70.978, 25.97, 0, 'Moored in Honningsvag'),
(6, 'Havbris', '2024-08-20 23:20:00', 70.978, 25.97, 0, 'Still moored in Honningsvag'),
(7, 'Eirabaten', '2024-08-20 22:05:00', 71.038, 27.991, 6.2, 'East of Mehamn on the fishing grounds'),
(8, 'Reinsdyret', '2024-08-20 22:50:00', 71.005, 25.81, 12, 'Tour group north of Kjollefjord'),
(9, 'Reinsdyret', '2024-08-20 23:20:00', 71.033, 25.87, 11.4, 'Tour group heading home'),
(10, 'Stormfugl', '2024-08-20 22:30:00', 70.9, 26, 0, 'Moored in Mehamn; harbour camera confirms'),
(11, 'Stormfugl', '2024-08-20 23:30:00', 70.9, 26, 0, 'Still moored in Mehamn'),
(12, 'Maken', '2024-08-20 22:05:00', 70.9785, 25.975, 3, 'Harbour patrol round in Honningsvag');
CREATE TABLE lab_results (
id INTEGER PRIMARY KEY,
evidence_id TEXT NOT NULL,
evidence_type TEXT NOT NULL,
description TEXT NOT NULL,
matched_to TEXT,
lab_note TEXT NOT NULL
);
INSERT INTO lab_results (id, evidence_id, evidence_type, description, matched_to, lab_note) VALUES
(1, 'E-201', 'paint fragment', 'Blue marine antifouling paint embedded in the barge rail', 'Skarven', 'Spectrographic match to hull samples from Skarven'),
(2, 'E-202', 'propeller fragment', 'Bent bronze blade tip with steel-hull impact marks', NULL, 'Typical of diesel engines above 300 hp'),
(3, 'E-203', 'fiberglass shards', 'White gelcoat shards', 'MS Fjordbris', 'Confirmed as debris from the victim vessel'),
(4, 'E-204', 'oil sample', 'Heavy marine diesel residue, 15W-40', NULL, 'Common to large diesel vessels in the local fleet'),
(5, 'E-205', 'rope fragment', 'Blue polypropylene mooring line', 'Stormfugl', 'Matches a chandlery order for Stormfugl; rope is commonly traded between crews');

  `,
);

createDatabase(
  "the-bellweather-murder",
  `
PRAGMA foreign_keys = ON;
CREATE TABLE people (
id INTEGER PRIMARY KEY,
full_name TEXT NOT NULL,
occupation TEXT NOT NULL,
home_district TEXT NOT NULL,
phone_extension TEXT
);
CREATE TABLE crime_scene (
id INTEGER PRIMARY KEY,
location TEXT NOT NULL,
discovered_at TEXT NOT NULL,
estimated_time_of_death TEXT NOT NULL,
cause_of_death TEXT NOT NULL,
scene_notes TEXT NOT NULL
);
CREATE TABLE evidence (
id INTEGER PRIMARY KEY,
item_name TEXT NOT NULL,
found_at TEXT NOT NULL,
description TEXT NOT NULL
);
CREATE TABLE witness_statements (
id INTEGER PRIMARY KEY,
witness_id INTEGER NOT NULL REFERENCES people(id),
taken_at TEXT NOT NULL,
statement TEXT NOT NULL
);
CREATE TABLE wardrobe (
id INTEGER PRIMARY KEY,
person_id INTEGER NOT NULL REFERENCES people(id),
garment TEXT NOT NULL,
color TEXT NOT NULL,
material TEXT NOT NULL,
distinctive_detail TEXT
);
CREATE TABLE medical_notes (
id INTEGER PRIMARY KEY,
person_id INTEGER NOT NULL REFERENCES people(id),
condition TEXT NOT NULL,
affected_side TEXT,
notes TEXT
);
CREATE TABLE vehicles (
id INTEGER PRIMARY KEY,
person_id INTEGER NOT NULL REFERENCES people(id),
make_model TEXT NOT NULL,
color TEXT NOT NULL,
license_plate TEXT NOT NULL UNIQUE
);
CREATE TABLE parking_claims (
id INTEGER PRIMARY KEY,
token_code TEXT NOT NULL,
vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
checked_in TEXT NOT NULL,
checked_out TEXT NOT NULL
);
CREATE TABLE purchases (
id INTEGER PRIMARY KEY,
person_id INTEGER NOT NULL REFERENCES people(id),
merchant TEXT NOT NULL,
item TEXT NOT NULL,
purchased_at TEXT NOT NULL
);
CREATE TABLE phone_calls (
id INTEGER PRIMARY KEY,
caller_id INTEGER NOT NULL REFERENCES people(id),
receiver_id INTEGER NOT NULL REFERENCES people(id),
started_at TEXT NOT NULL,
duration_seconds INTEGER NOT NULL
);
CREATE TABLE hotel_staff_shifts (
id INTEGER PRIMARY KEY,
person_id INTEGER NOT NULL REFERENCES people(id),
role TEXT NOT NULL,
shift_start TEXT NOT NULL,
shift_end TEXT NOT NULL
);
INSERT INTO people (id, full_name, occupation, home_district, phone_extension) VALUES
(1, 'Conrad Bell', 'Hotel proprietor', 'Northbank', '42'),
(2, 'Vivienne Shaw', 'City councillor', 'Northbank', '17'),
(3, 'Arthur Pike', 'Architect', 'Northbank', '51'),
(4, 'Mabel Crane', 'Nightclub singer', 'Theatre Row', '28'),
(5, 'Felix Ward', 'Physician', 'Old Town', '63'),
(6, 'Iris Vale', 'Newspaper columnist', 'West End', '34'),
(7, 'Gideon Frost', 'Banker', 'Northbank', '09'),
(8, 'Nora Quinn', 'Press photographer', 'Dockside', '76'),
(9, 'Samuel Reed', 'Bellhop', 'South Ward', NULL),
(10, 'Elsie Monroe', 'Florist', 'West End', '18'),
(11, 'Lionel Hart', 'Solicitor', 'Northbank', '55'),
(12, 'Theo Moss', 'Tobacconist', 'Old Town', '12'),
(13, 'Ada Finch', 'Hotel night clerk', 'South Ward', NULL);
INSERT INTO crime_scene VALUES
(1, 'Bellweather Hotel, suite 404', '1948-10-18 00:05', '1948-10-17 23:35-23:45', 'Blunt force trauma from a bronze bell bookend', 'Door was closed but unlocked. Wall safe stood open. A private black ledger was missing. Window latched from inside.');
INSERT INTO evidence VALUES
(1, 'Green thread', 'Service stair brass latch', 'A short emerald-green wool fibre, snagged at shoulder height.'),
(2, 'Cigarette ash', 'Carpet beside the desk', 'Fine grey ash with a pronounced bergamot and clove scent. No cigarette butt recovered.'),
(3, 'Parking token fragment', 'Inside the victim''s right hand', 'Torn claim ticket. Only a dash and the final digits "173" remain legible.'),
(4, 'Typed meeting note', 'Victim''s desk blotter', 'Reads: "11:30. Bring the original ledger. Come alone." No signature.'),
(5, 'Broken watch', 'Under the writing desk', 'Victim''s wristwatch stopped at 23:41 after a hard impact.'),
(6, 'Red clay', 'Balcony threshold', 'A dry smear matching clay used in hotel flower pots. Likely several days old.');
INSERT INTO witness_statements VALUES
(1, 9, '1948-10-18 00:32', 'At about 11:47 I saw someone hurry down the service stairs from the fourth floor. Long emerald coat, probably wool. They kept their face turned away and favored the left leg.'),
(2, 13, '1948-10-18 00:46', 'Mr. Bell asked me not to send calls up after eleven. Earlier, I connected a call from extension 17. I heard him say, "The ledger protects both of us," before I withdrew.'),
(3, 8, '1948-10-18 01:20', 'I was outside photographing the mayor. Near midnight a dark red motorcar pulled away from the hotel too fast for a clear plate.'),
(4, 4, '1948-10-18 01:42', 'Conrad had enemies everywhere. I sang at the Lark until quarter past midnight; the band and a room full of patrons can confirm it.'),
(5, 12, '1948-10-18 08:15', 'That citrus-and-clove tobacco is my No. 7 blend. I only sell it by the box, and I keep every customer receipt.');
INSERT INTO wardrobe VALUES
(1, 2, 'Long overcoat', 'Emerald green', 'Wool', 'Brass leaf clasp at the collar'),
(2, 3, 'Raincoat', 'Charcoal', 'Gabardine', 'Leather elbow patches'),
(3, 4, 'Evening wrap', 'Emerald green', 'Silk', 'Black fringe'),
(4, 5, 'Topcoat', 'Camel', 'Wool', 'Horn buttons'),
(5, 6, 'Pea coat', 'Navy blue', 'Wool', 'Silver anchor buttons'),
(6, 7, 'Overcoat', 'Forest green', 'Wool', 'Velvet collar'),
(7, 8, 'Field jacket', 'Olive green', 'Cotton', 'Camera strap repair on shoulder'),
(8, 10, 'Short coat', 'Moss green', 'Felt', 'Rose-shaped buttons'),
(9, 11, 'Chesterfield coat', 'Black', 'Cashmere', 'Grey velvet collar'),
(10, 12, 'Shop apron', 'Bottle green', 'Cotton', 'Two front pockets');
INSERT INTO medical_notes VALUES
(1, 2, 'Old ankle fracture', 'Left', 'Intermittent limp, worse in cold or wet weather'),
(2, 3, 'Meniscus injury', 'Right', 'Uses a brace after prolonged standing'),
(3, 4, 'Sprained wrist', 'Left', 'No effect on gait'),
(4, 5, 'Hearing loss', 'Left', 'Moderate'),
(5, 6, 'Childhood leg injury', 'Left', 'Walks with a cane on long journeys'),
(6, 7, 'Gout', 'Right', 'Occasional flare in foot'),
(7, 8, 'Shoulder strain', 'Right', 'Caused by camera equipment'),
(8, 10, 'Burn scar', 'Left', 'Hand only'),
(9, 11, 'Hip arthritis', 'Right', 'Mild limp after climbing stairs');
INSERT INTO vehicles VALUES
(1, 2, '1941 Buick Super', 'Burgundy', 'CY-9173'),
(2, 3, '1946 Packard Clipper', 'Black', 'AP-441'),
(3, 4, '1947 Cadillac Series 62', 'Cream', 'MC-719'),
(4, 5, '1942 Hudson Commodore', 'Grey', 'FW-173'),
(5, 6, '1946 Nash Ambassador', 'Navy', 'IV-731'),
(6, 7, '1947 Bentley Mark VI', 'Dark green', 'GF-173'),
(7, 8, '1948 Indian Chief motorcycle', 'Black', 'NQ-082'),
(8, 10, '1940 Ford Coupe', 'Green', 'EM-307'),
(9, 11, '1947 Studebaker Commander', 'Maroon', 'LH-541'),
(10, 12, '1939 Chevrolet delivery van', 'Brown', 'TM-113');
INSERT INTO parking_claims VALUES
(1, 'H-173', 1, '1948-10-17 23:12', '1948-10-17 23:52'),
(2, 'B-173', 6, '1948-10-17 20:05', '1948-10-17 22:11'),
(3, 'F-173', 4, '1948-10-17 23:18', '1948-10-18 00:20'),
(4, 'C-719', 3, '1948-10-17 20:30', '1948-10-18 00:24'),
(5, 'L-541', 9, '1948-10-17 18:42', '1948-10-17 22:32'),
(6, 'P-441', 2, '1948-10-17 17:55', '1948-10-17 19:03');
INSERT INTO purchases VALUES
(1, 2, 'Moss & Sons Tobacconist', 'No. 7 bergamot-clove cigarettes, 2 boxes', '1948-10-16 16:22'),
(2, 4, 'Moss & Sons Tobacconist', 'No. 7 bergamot-clove cigarettes, 1 box', '1948-10-10 14:05'),
(3, 6, 'Moss & Sons Tobacconist', 'No. 7 bergamot-clove cigarettes, 1 box', '1948-10-17 12:18'),
(4, 7, 'Moss & Sons Tobacconist', 'Havana cigars, 1 case', '1948-10-15 10:31'),
(5, 5, 'Moss & Sons Tobacconist', 'Cherry pipe tobacco, 1 tin', '1948-10-17 09:14'),
(6, 3, 'Northbank Stationer', 'Drafting vellum and black ink', '1948-10-17 15:48'),
(7, 10, 'Marley Textiles', 'Green felt, 3 yards', '1948-10-14 11:20'),
(8, 11, 'Moss & Sons Tobacconist', 'Safety matches, 6 books', '1948-10-12 13:10');
INSERT INTO phone_calls VALUES
(1, 2, 1, '1948-10-17 22:51', 142),
(2, 3, 1, '1948-10-17 18:20', 301),
(3, 4, 1, '1948-10-17 21:58', 48),
(4, 1, 11, '1948-10-17 22:12', 184),
(5, 7, 1, '1948-10-17 20:07', 512),
(6, 6, 1, '1948-10-17 23:02', 18),
(7, 5, 1, '1948-10-17 16:45', 93),
(8, 1, 13, '1948-10-17 22:59', 21);
INSERT INTO hotel_staff_shifts VALUES
(1, 9, 'Bellhop', '1948-10-17 16:00', '1948-10-18 00:30'),
(2, 13, 'Night clerk', '1948-10-17 20:00', '1948-10-18 06:00');

  `,
);

createDatabase(
  "midnight-library",
  `
CREATE TABLE crime_scene_report (
date INTEGER,
type TEXT,
description TEXT,
city TEXT
);
CREATE TABLE person (
id INTEGER PRIMARY KEY,
name TEXT,
license_id INTEGER,
address_number INTEGER,
address_street_name TEXT,
ssn TEXT
);
CREATE TABLE drivers_license (
id INTEGER PRIMARY KEY,
age INTEGER,
height INTEGER,
eye_color TEXT,
hair_color TEXT,
gender TEXT,
plate_number TEXT,
car_make TEXT,
car_model TEXT
);
CREATE TABLE interview (
person_id INTEGER,
transcript TEXT
);
CREATE TABLE get_fit_now_member (
id TEXT PRIMARY KEY,
person_id INTEGER,
name TEXT,
membership_start_date INTEGER,
membership_status TEXT
);
CREATE TABLE get_fit_now_check_in (
check_in_date INTEGER,
check_in_time INTEGER,
check_out_time INTEGER,
membership_id TEXT
);
CREATE TABLE income (
ssn TEXT PRIMARY KEY,
annual_income INTEGER
);
CREATE TABLE keycard (
id INTEGER PRIMARY KEY,
person_id INTEGER,
issued_date INTEGER
);
CREATE TABLE library_access_log (
access_id INTEGER PRIMARY KEY,
keycard_id INTEGER,
access_time INTEGER,
room TEXT,
event TEXT
);
CREATE TABLE library_inventory (
item_id INTEGER PRIMARY KEY,
item_name TEXT,
last_borrower_id INTEGER,
status TEXT
);
CREATE TABLE facebook_event (
event_id INTEGER PRIMARY KEY,
person_id INTEGER,
event_name TEXT,
date INTEGER,
status TEXT
);
INSERT INTO crime_scene_report (date, type, description, city) VALUES
(20230715, 'murder', 'Dr. Hugo Blackwell was found dead in the Rare Books Room at 23:45. Cause of death: blunt force trauma from a bronze bookend. A torn checkout slip with a partial membership number ''48Z'' was found on the floor. The door was unlocked with keycard #901 at 23:18.', 'Bergen');
INSERT INTO person (id, name, license_id, address_number, address_street_name, ssn) VALUES
(10001, 'Hugo Blackwell', 50001, 12, 'Torgallmenningen', '111223333'),
(10002, 'Elena Blackwell', 50002, 12, 'Torgallmenningen', '111224444'),
(10003, 'Marcus Vane', 50003, 45, 'Nygårdsgaten', '111225555'),
(10004, 'Ingrid Solberg', 50004, 7, 'Øvre Ole Bulls plass', '111226666'),
(10005, 'Lars Olsen', 50005, 88, 'Kaigaten', '111227777'),
(10006, 'Kari Nilsen', 50006, 21, 'Marken', '111228888'),
(10007, 'Erik Johannessen', 50007, 3, 'Vetrlidsallmenningen', '111229999');
INSERT INTO drivers_license (id, age, height, eye_color, hair_color, gender, plate_number, car_make, car_model) VALUES
(50001, 58, 180, 'brown', 'grey', 'male', 'BER-1234', 'Toyota', 'Camry'),
(50002, 54, 165, 'blue', 'blonde', 'female', 'BER-5678', 'BMW', 'X3'),
(50003, 42, 178, 'green', 'brown', 'male', 'BER-4321', 'Audi', 'A4'),
(50004, 31, 175, 'hazel', 'red', 'female', 'BER-4099', 'Volvo', 'V60'),
(50005, 45, 172, 'grey', 'brown', 'male', 'BER-9999', 'Ford', 'Focus'),
(50006, 29, 168, 'blue', 'brown', 'female', 'BER-2222', 'Hyundai', 'i30'),
(50007, 36, 182, 'brown', 'black', 'male', 'BER-7777', 'Tesla', 'Model 3');
INSERT INTO interview (person_id, transcript) VALUES
(10005, 'At about 23:40 I saw a tall person with red hair and a green hoodie leave the Rare Books Room and drive away in a dark Volvo. The license plate started with BER-4.'),
(10004, 'Hugo promised me the curator position, then gave it to Marcus. I was furious. I was at the gym from 20:00 to 21:30, then I went home to sleep.'),
(10003, 'I attended the library gala until 22:00 and then took a taxi home. I have nothing to hide.'),
(10002, 'I was at Get Fit Now from 21:00 until 22:30, then I went straight home.'),
(10006, 'I heard raised voices from the Rare Books Room around 23:20, but I did not see who it was.');
INSERT INTO get_fit_now_member (id, person_id, name, membership_start_date, membership_status) VALUES
('48Z21', 10004, 'Ingrid Solberg', 20220101, 'active'),
('99X01', 10002, 'Elena Blackwell', 20210515, 'active'),
('12A45', 10003, 'Marcus Vane', 20200620, 'expired'),
('77B09', 10005, 'Lars Olsen', 20190310, 'active'),
('33C88', 10006, 'Kari Nilsen', 20221001, 'active');
INSERT INTO get_fit_now_check_in (check_in_date, check_in_time, check_out_time, membership_id) VALUES
(20230715, 2000, 2130, '48Z21'),
(20230715, 2100, 2230, '99X01'),
(20230715, 1900, 2000, '12A45'),
(20230715, 1800, 1930, '77B09');
INSERT INTO income (ssn, annual_income) VALUES
('111223333', 920000),
('111224444', 610000),
('111225555', 780000),
('111226666', 410000),
('111227777', 510000),
('111228888', 540000),
('111229999', 670000);
INSERT INTO keycard (id, person_id, issued_date) VALUES
(901, 10004, 20200115),
(902, 10002, 20200116),
(903, 10003, 20200117),
(904, 10001, 20200110),
(905, 10005, 20200120);
INSERT INTO library_access_log (access_id, keycard_id, access_time, room, event) VALUES
(1, 901, 2318, 'Rare Books Room', 'entry'),
(2, 901, 2340, 'Rare Books Room', 'exit'),
(3, 904, 2215, 'Rare Books Room', 'entry'),
(4, 904, 2310, 'Rare Books Room', 'exit'),
(5, 903, 2105, 'Main Hall', 'entry'),
(6, 903, 2155, 'Main Hall', 'exit');
INSERT INTO library_inventory (item_id, item_name, last_borrower_id, status) VALUES
(1, 'Bronze Raven Bookend', 10004, 'missing'),
(2, 'Gutenberg Leaf Display Case Key', 10003, 'returned'),
(3, 'Rare Books Room Step Ladder', 10001, 'in place');
INSERT INTO facebook_event (event_id, person_id, event_name, date, status) VALUES
(1, 10003, 'Library Gala', 20230715, 'attending'),
(2, 10002, 'Library Gala', 20230715, 'not attending'),
(3, 10004, 'Library Gala', 20230715, 'not attending'),
(4, 10006, 'Library Gala', 20230715, 'attending');

  `,
);

createDatabase(
  "deed-and-probate",
  `
CREATE TABLE people (
id INTEGER PRIMARY KEY,
name TEXT NOT NULL,
relation TEXT NOT NULL,
address TEXT NOT NULL,
phone TEXT NOT NULL,
occupation TEXT NOT NULL
);
INSERT INTO people (id, name, relation, address, phone, occupation) VALUES
(1, 'Solveig Brandt', 'daughter', '14 Fjellgata, Bergen', '555-0102', 'architect'),
(2, 'Marta Fossheim', 'housekeeper', '1 Almenningen (manor)', '555-0117', 'housekeeper'),
(3, 'Tom Bakken', 'gardener', '3 Almenningen', '555-0131', 'gardener'),
(4, 'Victor Brandt', 'son', '2 Solsiden, Oslo', '555-0109', 'investment banker'),
(5, 'Liv Stene', 'niece', '8 Kirkeveien, Bergen', '555-0123', 'journalist'),
(6, 'Harald Eide', 'lawyer', '12 Radhusgata', '555-0140', 'attorney'),
(7, 'Ida Moen', 'neighbor', '5 Almenningen', '555-0155', 'retired teacher'),
(8, 'Jonas Vik', 'chauffeur', '1 Almenningen (manor)', '555-0161', 'driver');
CREATE TABLE invitations (
id INTEGER PRIMARY KEY,
guest_name TEXT NOT NULL,
event TEXT NOT NULL,
event_date TEXT NOT NULL,
rsvp TEXT NOT NULL,
note TEXT
);
INSERT INTO invitations (id, guest_name, event, event_date, rsvp, note) VALUES
(1, 'Solveig Brandt', 'Reading of the Will', '2024-06-12', 'yes', 'Requested the east drawing room'),
(2, 'Marta Fossheim', 'Reading of the Will', '2024-06-12', 'yes', NULL),
(3, 'Tom Bakken', 'Reading of the Will', '2024-06-12', 'yes', NULL),
(4, 'Victor Brandt', 'Reading of the Will', '2024-06-12', 'yes', 'Arriving from Oslo by evening train'),
(5, 'Liv Stene', 'Reading of the Will', '2024-06-12', 'no', 'Sent regrets; working on a deadline'),
(6, 'Harald Eide', 'Reading of the Will', '2024-06-12', 'yes', 'Officiating the reading'),
(7, 'Ida Moen', 'Reading of the Will', '2024-06-12', 'yes', 'Bringing cloudberry cake'),
(8, 'Jonas Vik', 'Reading of the Will', '2024-06-12', 'yes', NULL),
(9, 'Marta Fossheim', 'Spring Garden Party', '2024-05-01', 'yes', NULL),
(10, 'Ida Moen', 'Spring Garden Party', '2024-05-01', 'yes', NULL),
(11, 'Solveig Brandt', 'Spring Garden Party', '2024-05-01', 'yes', NULL);
CREATE TABLE deed_events (
id INTEGER PRIMARY KEY,
grantor TEXT NOT NULL,
grantee TEXT NOT NULL,
property TEXT NOT NULL,
event_type TEXT NOT NULL,
event_date TEXT NOT NULL,
filed_by TEXT NOT NULL,
file_ref TEXT NOT NULL
);
INSERT INTO deed_events (id, grantor, grantee, property, event_type, event_date, filed_by, file_ref) VALUES
(1, 'Astrid Brandt', 'Solveig Brandt', '1 Almenningen (Brandt Manor)', 'sale', '2024-05-20', 'Solveig Brandt', 'D-2024-051'),
(2, 'Victor Brandt', 'Nordvik Shipping AS', '2 Solsiden, Oslo', 'mortgage', '2024-05-28', 'Harald Eide', 'D-2024-066'),
(3, 'Astrid Brandt', 'Tom Bakken', 'The North Pasture', 'gift', '2024-04-02', 'Harald Eide', 'D-2024-031'),
(4, 'Solveig Brandt', 'Fjordbanken', '1 Almenningen (Brandt Manor)', 'mortgage', '2024-05-21', 'Solveig Brandt', 'D-2024-052'),
(5, 'Astrid Brandt', 'Ida Moen', '5 Almenningen', 'gift', '2019-06-15', 'Harald Eide', 'D-2019-118'),
(6, 'Harald Eide', 'Liv Stene', '8 Kirkeveien, Bergen', 'sale', '2021-09-10', 'Harald Eide', 'D-2021-204');
CREATE TABLE probate_cases (
id INTEGER PRIMARY KEY,
deceased TEXT NOT NULL,
date_of_death TEXT NOT NULL,
executor TEXT NOT NULL,
estate_value_nok INTEGER NOT NULL,
heir TEXT NOT NULL,
share_percent INTEGER NOT NULL,
will_date TEXT NOT NULL,
status TEXT NOT NULL
);
INSERT INTO probate_cases (id, deceased, date_of_death, executor, estate_value_nok, heir, share_percent, will_date, status) VALUES
(1, 'Astrid Brandt', '2024-06-10', 'Harald Eide', 8400000, 'Solveig Brandt', 60, '2023-11-30', 'contested'),
(2, 'Astrid Brandt', '2024-06-10', 'Harald Eide', 8400000, 'Victor Brandt', 30, '2023-11-30', 'contested'),
(3, 'Astrid Brandt', '2024-06-10', 'Harald Eide', 8400000, 'Marta Fossheim', 10, '2023-11-30', 'contested'),
(4, 'Astrid Brandt', '2024-06-10', 'Harald Eide', 8400000, 'Tom Bakken', 0, '2023-11-30', 'contested'),
(5, 'Johan Fossheim', '2018-03-15', 'Harald Eide', 1200000, 'Marta Fossheim', 100, '2017-01-10', 'closed');
CREATE TABLE crime_scene (
id INTEGER PRIMARY KEY,
item TEXT NOT NULL,
description TEXT NOT NULL,
location TEXT NOT NULL,
collected_at TEXT NOT NULL
);
INSERT INTO crime_scene (id, item, description, location, collected_at) VALUES
(1, 'Wine glass', 'Traces of the sedative chloral hydrate; one partial print', 'Beside the deceased', '2024-06-11 08:30:00'),
(2, 'Handwritten note', 'Reads: The manor was always meant to be mine', 'Study desk drawer', '2024-06-11 08:45:00'),
(3, 'Muddy footprints', 'Size 41, made by garden boots; mud also found in the boot cupboard', 'French doors', '2024-06-11 09:10:00'),
(4, 'Window latch', 'Forced from inside after the window had been opened', 'Study north wall', '2024-06-11 09:15:00'),
(5, 'Copy of will', 'Dated 2023-11-30; pages 2 and 3 are missing', 'Unlocked study cabinet', '2024-06-11 09:40:00'),
(6, 'Deed signature report', 'Astrid''s signature on file D-2024-051 was traced from the 2019 gift deed', 'Deed office lab', '2024-06-12 10:05:00');

  `,
);

createDatabase(
  "lighthouse-keepers-demise",
  `
CREATE TABLE witness_statements (
id INTEGER PRIMARY KEY,
witness_name TEXT NOT NULL,
role TEXT NOT NULL,
statement TEXT NOT NULL,
interview_room TEXT NOT NULL,
interview_minutes INTEGER NOT NULL,
agent TEXT NOT NULL
);
INSERT INTO witness_statements (id, witness_name, role, statement, interview_room, interview_minutes, agent) VALUES
(1, 'Bea Nilsson', 'Farmer', 'I was walking my dog along the cliff path and passed the South Trail camera at exactly 22:01. The fog was so thick I nearly lost my dog.', 'R1', 5, 'Det. Ruud'),
(2, 'Aron Fisker', 'Fisherman', 'My son Emil and I were out in the boat all evening. We didn''t get back to the harbour until about 23:00, maybe a bit past.', 'R2', 3, 'Det. Voss'),
(3, 'Ottar Ruud', 'Electrician', 'I was over at the Brink farm helping with a generator most of the evening. Drove home on the west road — my truck can''t handle the east road in this fog anyway.', 'R1', 12, 'Det. Voss'),
(4, 'Geir Foss', 'Deckhand', 'I was walking the east road toward the lighthouse around ten to have a smoke. I turned back before the lighthouse because of the fog, couldn''t see a thing.', 'R1', 8, 'Det. Ruud'),
(5, 'Siv Bakke', 'Barkeep', 'Stig left my tavern around 21:35, right after closing time for him. He seemed upset about something he''d read in a letter.', 'R2', 9, 'Det. Voss'),
(6, 'Emil Fisker', 'Fisherman''s son', 'I got off my father''s boat at the harbour and walked home past the east camera. I think it was around 22:30? I was in a hurry, it was cold.', 'R1', 3, 'Det. Ruud'),
(7, 'Hedda Bru', 'Retired teacher', 'The motorbikes in this village are a menace. One went tearing down the main road late that night. One day someone will get hurt.', 'R2', 14, 'Det. Ruud'),
(8, 'Trine Haug', 'Choir director', 'Choir practice ended at 21:50. Stig had sent me a message that morning saying he might not come to practice — something about paperwork.', 'R1', 7, 'Det. Voss'),
(9, 'Odd Bremnes', 'Deputy keeper', 'I was at the North Trail camera from 21:00 to 22:00 on lookout duty. The fog meant I couldn''t see the tower light, which worried me.', 'R1', 11, 'Det. Voss'),
(10, 'Rakel Voll', 'Hill farmer', 'I found him, poor man. I went up at midnight to take him his bread, like always. The door was open. The light was dark. I''ll never forget it.', 'R2', 16, 'Det. Ruud');
CREATE TABLE agents (
id INTEGER PRIMARY KEY,
agent_id TEXT NOT NULL,
name TEXT NOT NULL,
role TEXT NOT NULL,
phone_number TEXT NOT NULL
);
INSERT INTO agents (id, agent_id, name, role, phone_number) VALUES
(1, 'AG-4471', 'Odd Bremnes', 'Handyman', '220-555-0192'),
(2, 'AG-4471', 'Geir Foss', 'Boat courier', '220-555-0134'),
(3, 'AG-4471', 'Ottar Ruud', 'Electrician', '220-555-0177'),
(4, 'AG-4471', 'Ingrid Myhr', 'Cafe owner', '220-555-0165'),
(5, 'AG-8830', 'Kari Voll', 'Seamstress', '220-555-0111'),
(6, 'AG-2290', 'Per Holm', 'Pensioner', '220-555-0148');
CREATE TABLE phone_calls (
id INTEGER PRIMARY KEY,
caller_name TEXT NOT NULL,
callee_name TEXT NOT NULL,
call_duration_minutes REAL NOT NULL,
call_date TEXT NOT NULL
);
INSERT INTO phone_calls (id, caller_name, callee_name, call_duration_minutes, call_date) VALUES
(1, 'Odd Bremnes', '220-555-0900', 2, '2024-10-14'),
(2, 'Odd Bremnes', 'Ingrid Myhr', 8.3, '2024-10-13'),
(3, 'Ottar Ruud', 'Stig Kran', 1.2, '2024-10-14'),
(4, 'Geir Foss', 'Ottar Ruud', 3.1, '2024-10-12'),
(5, 'Ingrid Myhr', 'Kari Voll', 12.4, '2024-10-14'),
(6, 'Geir Foss', '220-555-0900', 0.9, '2024-10-14'),
(7, 'Per Holm', 'Ingrid Myhr', 4, '2024-10-11'),
(8, 'Ottar Ruud', 'Ingrid Myhr', 6.6, '2024-10-10');
CREATE TABLE camera_logs (
id INTEGER PRIMARY KEY,
camera_location TEXT NOT NULL,
timestamp TEXT NOT NULL,
description TEXT NOT NULL
);
INSERT INTO camera_logs (id, camera_location, timestamp, description) VALUES
(1, 'South Trail', '2024-10-14 22:01:00', 'Female, dark hair, walking dog, heading north'),
(2, 'Harbour Dock', '2024-10-14 22:47:00', 'Fishing boat arriving, two adult males aboard'),
(3, 'East Lighthouse Road', '2024-10-14 21:56:00', 'Lone male on bicycle, heading toward lighthouse'),
(4, 'East Lighthouse Road', '2024-10-14 22:34:00', 'Lone male, dark coat, walking, heading away from lighthouse'),
(5, 'North Trail', '2024-10-14 21:12:00', 'Male in rain gear standing still, looking through binoculars'),
(6, 'South Trail', '2024-10-14 23:18:00', 'Delivery truck, heading south out of the village'),
(7, 'Harbour Dock', '2024-10-14 23:05:00', 'Lone male on foot, heading into village'),
(8, 'Main Road', '2024-10-14 22:15:00', 'Motorbike, no license plate visible, heading east');
CREATE TABLE evidence (
id INTEGER PRIMARY KEY,
evidence_id TEXT NOT NULL,
evidence_name TEXT NOT NULL,
description TEXT NOT NULL,
location_found TEXT NOT NULL
);
INSERT INTO evidence (id, evidence_id, evidence_name, description, location_found) VALUES
(1, 'E-114', 'Oilskin raincoat, size L', 'Smells of engine grease; torn sleeve', 'Reported by a beachcomber at the base of the cliff'),
(2, 'E-109', 'Victorion wristwatch', 'Stopped at 22:37', 'Still on the victim''s wrist; strap torn'),
(3, 'E-121', 'Delivery van', 'Engine grease stains on floor mat', 'Registered to Ottar Ruud; used by AG-4471 couriers; impounded at the harbour shed'),
(4, 'E-118', 'Handwritten letter', 'Letterhead: BRODSKORP & VANN LAW FIRM', 'Found in victim''s coat pocket; referenced a probate meeting'),
(5, 'E-125', 'Handwritten note', 'Reads: "S — the harbour payment is ready. Come after the light is lit. — I.M."', 'Found crumpled in the grate of the lighthouse stove'),
(6, 'E-107', 'Hemp rope, 10 m', 'Clean cut, no fraying', 'Belongs to the lighthouse inventory; found coiled by the rail'),
(7, 'E-130', 'Muddy boot print, size 43', 'Tread of a work boot', 'On the tower stairs; matched to several villagers'' boots');

  `,
);
