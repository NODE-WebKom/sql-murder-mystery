import type { CaseDefinition, CaseSlug } from "./types";

export const CASE_SLUGS: CaseSlug[] = [
  "the-last-espresso",
  "the-blackthorn-ledger",
  "midnight-at-pier-nine",
  "manor",
  "nordkapp-fjord",
  "the-bellweather-murder",
  "thesis",
  "midnight-library",
  "deed-and-probate",
  "coffee",
  "lighthouse-keepers-demise",
];

export const CASES: Record<CaseSlug, CaseDefinition> = {
  "the-last-espresso": {
    slug: "the-last-espresso",
    caseNumber: "CASE 01",
    title: "The Last Espresso",
    subtitle: "A five-minute window. One fatal cup.",
    difficulty: "Beginner",
    estimatedMinutes: 25,
    boardNote:
      "The cafe was nut-free. The victim's final espresso was not.",
    date: "17 February 2026, 22:12",
    location: "The Nightjar Cafe, Pier Street",
    victim: "Gabriel Vale, proprietor",
    accent: "#e0aa3e",
    accentDark: "#705019",
    brief: [
      "Rain had turned Pier Street black when Gabriel Vale, owner of the Nightjar Cafe, was found dead in his back office. His final order was a plain double espresso.",
      "The cup contained hazelnut protein despite the cafe being strictly nut-free because of Gabriel's severe allergy. The espresso waited unattended at the service station for five minutes. Several people had grudges. Only one had both the means and the opportunity.",
    ],
    facts: [
      { label: "Time found", value: "22:12" },
      { label: "Final order", value: "Double espresso, plain" },
      { label: "Unattended", value: "21:49 to 21:54" },
      { label: "Cause", value: "Severe hazelnut reaction" },
    ],
    statements: [
      "Bookkeeper Elise Harrow said she stayed in the dining room from 21:32 until she left.",
      "Barista Mina Cole said she stepped into the loading bay to sign for a delivery.",
      "Supplier Jonah Reed admitted buying hazelnut extract, but said he never crossed behind the counter.",
    ],
    objective:
      "Name the killer, explain how the espresso was contaminated, and establish the motive.",
    skills: ["Filtering", "Simple joins", "Time windows"],
    hints: [
      "Start with drink_orders. Determine when Gabriel's espresso was ready and when he collected it.",
      "Find service-station visits that overlap 21:49 to 21:54, then compare those people with recent purchases of hazelnut extract.",
      "Join persons to both access_logs and purchases through person_id. Only one person had the product and entered the service station during the window.",
    ],
    starterSql: `-- Start with the forensic findings.
SELECT finding_type, title, details
FROM findings
ORDER BY recorded_at;`,
  },
  "the-blackthorn-ledger": {
    slug: "the-blackthorn-ledger",
    caseNumber: "CASE 02",
    title: "The Blackthorn Ledger",
    subtitle: "Three invoices. Two names. One account.",
    difficulty: "Intermediate",
    estimatedMinutes: 45,
    boardNote:
      "An auditor died in a sealed archive. His pocket ledger was still open.",
    date: "17 October 2026, 22:17",
    location: "Blackthorn Civic Trust",
    victim: "Elias Rook, trust auditor",
    accent: "#5f91a6",
    accentDark: "#284957",
    brief: [
      "Night guard Theo Bell found auditor Elias Rook dead in the records archive. Carbon-monoxide exposure occurred between 21:46 and 22:04. Exhaust entered through a return-air hatch accessible from the restricted Archive Service Level.",
      "Equipment marks identify a gasoline utility pump. Moving and positioning it required at least ten minutes. Rook had been auditing vendor payments. His pocket ledger reads: 3 invoices / 2 vendor names / 1 payout account / over $90,000.",
    ],
    facts: [
      { label: "Fatal window", value: "21:46 to 22:04" },
      { label: "Exposure", value: "Carbon monoxide" },
      { label: "Equipment", value: "Gasoline utility pump" },
      { label: "Setup time", value: "At least 10 minutes" },
    ],
    statements: [
      "Finance director Mara Voss said she left before 21:45 and called counsel from the Lantern Cafe.",
      "Facilities supervisor Calder Wynn said his gasoline pump was at West Ferry.",
      "Procurement officer Julian Cross admitted visiting the service level after hearing machinery.",
      "Deputy controller Lena Orr said she worked remotely all evening.",
    ],
    objective:
      "Connect Rook's ledger pattern to the equipment loan and a qualifying service-level visit.",
    skills: ["Aggregation", "Interval overlap", "Multi-table joins"],
    hints: [
      "Build separate candidate lists for money, equipment, and opportunity before comparing names.",
      "A loan overlaps the fatal window when it starts before the window ends and is returned after the window begins. Pair each service-level entry with its next exit.",
      "The financial pattern, matching equipment loans, and ten-minute service visits should each produce a short list. Intersect those lists by person_id.",
    ],
    starterSql: `-- Rook left a numerical pattern. Inspect payments and vendors.
SELECT v.legal_name, v.payout_account_ref,
       p.invoice_number, p.amount_cents / 100.0 AS amount,
       p.approved_by_person_id
FROM payments AS p
JOIN vendors AS v ON v.vendor_id = p.vendor_id
ORDER BY v.payout_account_ref, p.paid_at;`,
  },
  "midnight-at-pier-nine": {
    slug: "midnight-at-pier-nine",
    caseNumber: "CASE 03",
    title: "Midnight at Pier Nine",
    subtitle: "The chamber remembered what everyone else buried.",
    difficulty: "Advanced",
    estimatedMinutes: 70,
    boardNote:
      "A dead doctor. A child's recording. A name erased for twenty years.",
    date: "15 November 2026, 00:17",
    location: "Controlled-Atmosphere Chamber N-9",
    victim: "Dr. Mara Vale, founder of Aster House",
    accent: "#a1433f",
    accentDark: "#541f24",
    brief: [
      "At 00:17, a night watch officer opened chamber N-9. Dr. Mara Vale sat beneath its emergency speaker, apparently uninjured. The speaker repeated an old recording in which Vale told a frightened child that memory was merely another thing adults could rewrite.",
      "Vale had founded Aster House, an abusive behavioral program later buried through settlements. Hours before her death she threatened former staff and surviving subjects with professional ruin. She planned to sell their recordings as leverage.",
      "The postmortem places death between 23:55 and 00:12. Vale was first incapacitated with clinical sedative S-17. Oxygen deprivation caused by the chamber atmosphere system was fatal. Its occupancy interlock should have made the purge impossible.",
    ],
    facts: [
      { label: "Death window", value: "23:55 to 00:12" },
      { label: "Sedative", value: "Two doses of S-17" },
      { label: "Fatal mechanism", value: "N-9 atmosphere purge" },
      { label: "Recording", value: "LARK-09 / SESSION-14" },
    ],
    statements: [
      "Port security chief Elias Venn said he tested N-9 before 23:00 and left it safe.",
      "Clinic physician Ivo Mercer had access to S-17 and was being blackmailed over its ledger.",
      "Electrician Tomas Quill ran a purge test on nearby chamber C-8 during the death window.",
      "Archivist Lena Ash knew what SESSION-14 contained but refused to release it.",
    ],
    objective:
      "Reconstruct the killer's route, drug possession, control actions, hidden identity, and motive.",
    skills: ["CTEs", "Conditional sums", "Alias matching", "Set intersection"],
    hints: [
      "Build one grouped candidate set for each independent source: route, sedative balance, chamber controls, and the victim's alias references.",
      "Treat inventory movements as a balance. Keep N-9 separate from C-8 and require both lethal control actions from the same credential.",
      "Vale never used the killer's current name. Match person_aliases inside her outbound communications, then join that set to the route, S-17, and control CTEs.",
    ],
    starterSql: `-- The old names matter as much as the current ones.
SELECT p.full_name, p.occupation, a.alias, a.alias_type
FROM people AS p
LEFT JOIN person_aliases AS a ON a.person_id = p.person_id
ORDER BY p.full_name;`,
  },
  "manor": {
    slug: "manor",
    caseNumber: "CASE 04",
    title: "The Manor Murder",
    subtitle: "One dead lord. Twelve guests. One liar with red hair.",
    difficulty: "Beginner",
    estimatedMinutes: 20,
    boardNote: "Lord Havisham is dead in the library. A storm has washed out the only road.",
    date: "Weekend of the great storm",
    location: "Havisham Manor, 2nd floor library",
    victim: "Lord Havisham",
    accent: "#f6e58d",
    accentDark: "#c4a02d",
    brief: [
      "Lord Havisham is dead in the library and a storm has washed out the only road. Twelve guests, four staff, and one of them is lying. The evidence is all in the database.",
      "The body was found at 11:05pm; the doctor puts the time of death at 10:15pm. The road flooded by midnight, so nobody has left the house — the murderer is still under this roof, drinking brandy in the drawing room.",
    ],
    facts: [
      { label: "Time found", value: "11:05pm" },
      { label: "Time of death", value: "10:15pm" },
      { label: "Location", value: "2nd floor library" },
      { label: "Road status", value: "Washed out by midnight" },
    ],
    statements: [
      "Mr. Chen the butler was locking up the cellar until 11:30pm with the cook.",
      "Ingrid Larsen the maid was turning down beds on the third floor all evening.",
      "Old Tam the gardener was off the grounds since dusk due to the storm.",
      "Victoria Pemberton claimed she was in her room composing a letter.",
    ],
    objective:
      "Use the crime scene report and witness interviews to identify which guest — red-haired and carrying a monocle — killed Lord Havisham on the second floor.",
    skills: ["Filtering", "WHERE clauses", "Multi-table joins"],
    hints: [
      "Start with the crime_scene_report table. Three reports tell you three things about the killer: hair color, accessory, and which floor the killer fled along.",
      "Cross-reference the report details against the guests table with a SELECT ... WHERE. Mind the decoys — more than one guest matches part of the description.",
      "The murderer is the guest on the right floor with red hair AND a monocle.",
    ],
    starterSql: `-- What does the crime scene report say?
SELECT * FROM crime_scene_report;`,
  },
  "nordkapp-fjord": {
    slug: "nordkapp-fjord",
    caseNumber: "CASE 05",
    title: "The Nordkapp Fjord Mystery",
    subtitle: "The sea remembers which boat was there.",
    difficulty: "Beginner",
    estimatedMinutes: 25,
    boardNote: "A supply barge sinks in the night. Whoever struck it left without sending a distress call.",
    date: "20 August 2024, 23:12",
    location: "Nordkapp Bank, latitude 71.1042",
    victim: "MS Fjordbris (sunk), skipper lost",
    accent: "#f9c74f",
    accentDark: "#a07820",
    brief: [
      "On the night of August 20th, 2024, the supply barge MS Fjordbris was rammed and sunk near Nordkapp Bank. The skipper was lost with her. Whoever struck the barge left without sending a distress call.",
      "Debris from both vessels washed ashore at dawn. You have the harbour suspect registry, AIS and GPS pings from that night, and the lab's analysis of the recovered debris. The collision happened at approximately 23:12 near latitude 71.1042, longitude 25.9917.",
    ],
    facts: [
      { label: "Collision time", value: "23:12" },
      { label: "Location", value: "Nordkapp Bank" },
      { label: "Latitude", value: "71.1042" },
      { label: "Longitude", value: "25.9917" },
    ],
    statements: [
      "Karl Antonsen said he went home after the fish auction at 21:00.",
      "Petter Lynge was working at the harbour office and logged out at 22:10.",
      "Sigurd Eira was mending nets at the dock with his brother.",
      "Magnus Olsen was home with his family from 20:00.",
    ],
    objective:
      "Identify which boat struck the barge by matching GPS pings, lab evidence, and suspect alibis.",
    skills: ["Filtering", "JOINs", "Timestamp comparisons"],
    hints: [
      "SELECT * FROM lab_results — what did the debris reveal?",
      "SELECT * FROM suspects WHERE engine_type = 'diesel' AND engine_hp > 300 — whose engine fits the damage?",
      "Check GPS pings for boats near the barge lane around 23:10.",
      "Join suspects to gps_pings through boat_name to match opportunity with evidence.",
    ],
    starterSql: `-- What did the lab find in the debris?
SELECT * FROM lab_results;`,
  },
  "the-bellweather-murder": {
    slug: "the-bellweather-murder",
    caseNumber: "CASE 06",
    title: "The Bellweather Murder",
    subtitle: "A locked room. A missing ledger. One loose thread.",
    difficulty: "Intermediate",
    estimatedMinutes: 45,
    boardNote: "Hotel proprietor Conrad Bell was found dead in suite 404 just after midnight.",
    date: "18 October 1948, 00:05",
    location: "Bellweather Hotel, Northbank, suite 404",
    victim: "Conrad Bell, hotel proprietor",
    accent: "#ffc5cb",
    accentDark: "#b35a62",
    brief: [
      "Hotel proprietor Conrad Bell was found dead in suite 404 just after midnight. His safe was open, a private black ledger was missing, and a figure escaped by the service stairs.",
      "Conrad Bell died from a blow with a bronze bookend between 11:35 and 11:45pm. The suite door was closed but unlocked and the window remained latched from inside.",
    ],
    facts: [
      { label: "Time found", value: "00:05" },
      { label: "Fatal window", value: "23:35 to 23:45" },
      { label: "Cause", value: "Blunt force trauma" },
      { label: "Missing item", value: "Private black ledger" },
    ],
    statements: [
      "Bellhop Samuel Reed saw someone hurrying down the service stairs at 11:47 in a long emerald coat, favoring the left leg.",
      "Night clerk Nora Quinn connected a call from extension 17 where Bell mentioned 'the ledger protects both of us'.",
      "Press photographer Nora Quinn saw a dark red motorcar pull away from the hotel near midnight.",
      "Tobacconist Theo Moss said his No. 7 bergamot-clove blend is sold only by the box with receipts kept.",
    ],
    objective:
      "Connect the emerald-green fibre, the bergamot-clove ash, the parking token, and the late phone call to one suspect.",
    skills: ["Multi-table joins", "Interval overlap", "Evidence cross-referencing"],
    hints: [
      "Begin with crime_scene, evidence, and witness_statements. Write down the physical details of the fleeing figure and the items found in suite 404.",
      "The trail crosses wardrobe, medical_notes, purchases, and parking_claims. Join through people and vehicles, paying attention to material, affected side, tobacco blend, and token code.",
      "One suspect owned an emerald wool coat, had a left-leg injury, bought No. 7 bergamot-clove cigarettes, and held parking token H-173 during the murder window.",
    ],
    starterSql: `-- What evidence was found at the scene?
SELECT * FROM evidence;`,
  },
  "thesis": {
    slug: "thesis",
    caseNumber: "CASE 07",
    title: "The Stolen Thesis",
    subtitle: "The original vanished from a locked office at 2am.",
    difficulty: "Advanced",
    estimatedMinutes: 30,
    boardNote: "A master's thesis vanished from locked office B-12 between 2 and 3 in the morning.",
    date: "3 May 2025, 02:31",
    location: "Department of Informatics, thesis office B-12",
    victim: "Stolen master's thesis and backup drive",
    accent: "#a8dadc",
    accentDark: "#457b9d",
    brief: [
      "The only printed original of a master's thesis vanished from locked office B-12 between 2 and 3 in the morning. The card reader logs and printer queues hold the whole story.",
      "Ten students had late access to the building that night — exam season. At 02:31 the door of thesis office B-12 was forced, and by morning the printed original and the backup drive were gone.",
    ],
    facts: [
      { label: "Time of break-in", value: "02:31" },
      { label: "Location", value: "Office B-12" },
      { label: "Stolen", value: "Printed thesis + backup drive" },
      { label: "Access", value: "10 student cards" },
    ],
    statements: [
      "The night guard reported a figure in a lab coat at the STAIRWELL-2 printer at 03:12.",
      "A fresh cover page matching department paper stock was found in the recycling bin outside B-12.",
      "Registrar confirmed B-12 had no bookings that night and the card reader log was pulled.",
    ],
    objective:
      "Identify the thief by matching card access to B-12 with the decoy cover page print job.",
    skills: ["JOINs on card_id", "Timestamp matching", "Incident log analysis"],
    hints: [
      "Read the incident_log table first. It names the room (B-12), the night, and something suspicious about a printer.",
      "Join lab_access with students on card_id. Only one card entered B-12 around 02:31 on May 3rd — but check the print_jobs table before you accuse anyone.",
      "The thief entered B-12 AND printed the decoy cover page. Match both actions to one card_id.",
    ],
    starterSql: `-- What happened that night?
SELECT * FROM incident_log;`,
  },
  "midnight-library": {
    slug: "midnight-library",
    caseNumber: "CASE 08",
    title: "The Midnight Library Murder",
    subtitle: "A torn slip. A missing bookend. One killer in the stacks.",
    difficulty: "Advanced",
    estimatedMinutes: 35,
    boardNote: "Dr. Hugo Blackwell was found dead in the Rare Books Room at 11:45pm.",
    date: "15 July 2023, 23:45",
    location: "Bergen Library, Rare Books Room",
    victim: "Dr. Hugo Blackwell",
    accent: "#b5e48c",
    accentDark: "#5a8a30",
    brief: [
      "Dr. Hugo Blackwell was found dead in the Rare Books Room at 11:45pm. A torn checkout slip and the library's electronic records can identify his killer.",
      "Blackwell died from blunt force trauma inflicted with a bronze bookend. A witness saw a tall, red-haired figure in a green hoodie leave the room and drive away in a dark Volvo.",
    ],
    facts: [
      { label: "Time found", value: "23:45" },
      { label: "Cause", value: "Blunt force trauma" },
      { label: "Weapon", value: "Bronze bookend (missing)" },
      { label: "Keycard", value: "#901 entered at 23:18" },
    ],
    statements: [
      "Lars Olsen saw a tall red-haired person in a green hoodie leave the Rare Books Room and drive a dark Volvo with plate starting BER-4.",
      "Ingrid Solberg said she was furious about the curator position but claimed she was at the gym until 21:30 then went home.",
      "Marcus Vane attended the library gala until 22:00 then took a taxi home.",
      "Kari Nilsen heard raised voices from the Rare Books Room around 23:20.",
    ],
    objective:
      "Match the torn gym membership slip, the keycard entry, the missing bookend, and the witness description to one person.",
    skills: ["Multi-table joins", "Partial ID matching", "Alibi verification"],
    hints: [
      "Read crime_scene_report carefully. The torn slip supplies part of a gym membership number, while the door record supplies a keycard number and entry time.",
      "Compare the matching member's interview with get_fit_now_check_in, then join keycard to library_access_log.",
      "Corroborate identity: join person to drivers_license, get_fit_now_member, keycard and library_inventory. Look for membership 48Z, keycard 901, and the missing bronze bookend.",
    ],
    starterSql: `-- What does the crime scene report say?
SELECT * FROM crime_scene_report;`,
  },
  "deed-and-probate": {
    slug: "deed-and-probate",
    caseNumber: "CASE 09",
    title: "The Deed & the Dead",
    subtitle: "A forged deed, a family will and a glass of wine.",
    difficulty: "Advanced",
    estimatedMinutes: 35,
    boardNote: "Astrid Brandt never woke. Her evening wine held a sedative. One document is troubling.",
    date: "11 June 2024, morning",
    location: "Brandt Manor study",
    victim: "Astrid Brandt, 79",
    accent: "#a8dadc",
    accentDark: "#457b9d",
    brief: [
      "Astrid Brandt, 79, was found dead in her study on the morning of June 11th, one day before the reading of her will. The family doctor wrote heart failure. The detective at the scene wrote convenient.",
      "A sedative was later found in Astrid's evening wine. The deed office digitised its files for the case. One document is especially troubling: a sale of Brandt Manor filed only three weeks before Astrid died.",
    ],
    facts: [
      { label: "Time found", value: "Morning of June 11" },
      { label: "Cause", value: "Heart failure (suspected)" },
      { label: "Sedative", value: "Chloral hydrate in wine" },
      { label: "Suspicious filing", value: "Manor sale, 20 May 2024" },
    ],
    statements: [
      "Solveig Brandt, the daughter, filed a deed transferring Brandt Manor to herself on 20 May.",
      "Marta Fossheim the housekeeper confirmed Astrid was upset about something in her will.",
      "Tom Bakken the gardener said his boots were in the cupboard by the French doors.",
      "Victor Brandt the son was in Oslo and arrived by evening train.",
    ],
    objective:
      "Connect the forged deed, the mortgaged manor, the sedated wine, and the staged break-in to one family member.",
    skills: ["Deed/probate joins", "Date sequencing", "Crime scene analysis"],
    hints: [
      "SELECT * FROM probate_cases WHERE deceased = 'Astrid Brandt' — who inherits?",
      "SELECT * FROM deed_events WHERE property LIKE '%Brandt Manor%' — a sale and mortgage, one day apart.",
      "SELECT * FROM crime_scene — read the lab findings, not only the obvious footprints.",
      "SELECT * FROM invitations WHERE event = 'Reading of the Will' — who had access?",
    ],
    starterSql: `-- Who stands to inherit?
SELECT * FROM probate_cases WHERE deceased = 'Astrid Brandt';`,
  },
  "coffee": {
    slug: "coffee",
    caseNumber: "CASE 10",
    title: "The Poisoned Coffee",
    subtitle: "Arsenic in the oat milk. Someone had the keys.",
    difficulty: "Advanced",
    estimatedMinutes: 30,
    boardNote: "Professor Harold Kane dropped dead over his 8:42 flat white.",
    date: "16 May 2025, morning",
    location: "Department kitchen",
    victim: "Professor Harold Kane",
    accent: "#ffd6a5",
    accentDark: "#b37a40",
    brief: [
      "Professor Harold Kane dropped dead over his 8:42 flat white. The arsenic was in the shared oat milk carton — delivered fresh to the storeroom fridge on Thursday afternoon. Someone on the duty rota opened that fridge.",
      "The autopsy says arsenic. The receipt trail from the campus loyalty-card database says someone went shopping that week.",
    ],
    facts: [
      { label: "Time of death", value: "08:42" },
      { label: "Cause", value: "Arsenic poisoning" },
      { label: "Delivery", value: "Thursday afternoon" },
      { label: "Oat milk", value: "Shared carton, storeroom fridge" },
    ],
    statements: [
      "Marta Ilves was on kitchen duty Thursday and had access to the storeroom fridge.",
      "Bram Willems the groundskeeper also bought rodenticide but was on Saturday duty.",
      "Dev Patel bought a humane mouse trap, not poison.",
      "Grace Okafor handled dish soap and sponges on Friday.",
    ],
    objective:
      "Match the Thursday kitchen duty, the rodenticide purchase, and the oat milk contamination to one person.",
    skills: ["Multi-table joins", "Duty rota analysis", "Purchase pattern matching"],
    hints: [
      "The poison had to go into the carton while it sat in the storeroom fridge — Thursday. Check who was on kitchen_duty on Thursday.",
      "The purchases table holds the loyalty-card records. Look for an item you can buy at a garden supply store but should never bring near a kitchen.",
      "Join kitchen_duty and purchases through person_id where weekday = 'Thursday' and the item matches rodenticide.",
    ],
    starterSql: `-- Who was on kitchen duty Thursday?
SELECT p.name, kd.weekday
FROM people p
JOIN kitchen_duty kd ON kd.person_id = p.id
WHERE kd.weekday = 'Thursday';`,
  },
  "lighthouse-keepers-demise": {
    slug: "lighthouse-keepers-demise",
    caseNumber: "CASE 11",
    title: "The Lighthouse Keeper's Demise",
    subtitle: "The light went dark over Brannvik.",
    difficulty: "Advanced",
    estimatedMinutes: 40,
    boardNote: "The keeper lies at the bottom of the cliff. The light was never lit that night.",
    date: "15 October 2024, just after midnight",
    location: "Brannvik Lighthouse, cliff base",
    victim: "Stig Kran, lighthouse keeper",
    accent: "#f6e58d",
    accentDark: "#c4a02d",
    brief: [
      "Stig Kran, keeper of the Brannvik light for nineteen years, was found at the base of the cliff below the tower shortly after midnight on October 15th, 2024.",
      "He was last seen alive leaving the village tavern at 21:35. The light was never lit that night. Police have gathered witness statements, camera logs, phone records and physical evidence. Rumour says Stig had been carrying a letter he meant to destroy — something about an inheritance.",
    ],
    facts: [
      { label: "Time found", value: "Just after midnight" },
      { label: "Last seen", value: "21:35, leaving tavern" },
      { label: "Light status", value: "Never lit" },
      { label: "Letter", value: "About inheritance, to be destroyed" },
    ],
    statements: [
      "Geir Foss said he walked the east road around ten to smoke, but turned back before the lighthouse.",
      "Ottar Ruud said he was at the Brink farm helping with a generator.",
      "Siv Bakke the barkeep said Stig left upset about something in a letter.",
      "Odd Bremnes was on lookout duty at the North Trail camera from 21:00 to 22:00.",
    ],
    objective:
      "Connect the camera logs, the grease-stained raincoat, the phone records, and the courier network to identify who killed Stig Kran and who ordered it.",
    skills: ["Camera log analysis", "Phone record tracing", "Evidence chain linking"],
    hints: [
      "SELECT * FROM witness_statements — read everyone's story.",
      "SELECT * FROM camera_logs WHERE camera_location = 'East Lighthouse Road' — Geir said he turned back early, but what does the camera show?",
      "SELECT * FROM evidence WHERE description LIKE '%grease%' — grease on the raincoat.",
      "SELECT * FROM phone_calls — who talked to whom? Match Geir to Ottar.",
    ],
    starterSql: `-- What do the witnesses say?
SELECT * FROM witness_statements;`,
  },
};

export function isCaseSlug(value: string): value is CaseSlug {
  return CASE_SLUGS.includes(value as CaseSlug);
}

export function getCase(value: string): CaseDefinition | undefined {
  return isCaseSlug(value) ? CASES[value] : undefined;
}

export const CASE_LIST = CASE_SLUGS.map((slug) => CASES[slug]);
