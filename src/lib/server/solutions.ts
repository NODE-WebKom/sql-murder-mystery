import "server-only";

import type { VerdictPayload, VerdictResult } from "@/lib/types";
import type { CaseSlug } from "@/lib/types";

interface SolutionField {
  aliases: string[];
  concepts?: string[][];
}

interface Solution {
  culprit: SolutionField;
  /** Retained for reference; only the culprit is checked. */
  method: SolutionField;
  motive: SolutionField;
  reconstruction: string;
}

const SOLUTIONS: Record<CaseSlug, Solution> = {
  "the-last-espresso": {
    culprit: {
      aliases: ["elise harrow", "elise", "harrow", "e harrow"],
    },
    method: {
      aliases: [
        "hazelnut extract in the espresso",
        "hazelnut extract in espresso",
        "contaminated the espresso with hazelnut",
        "spiked the coffee with hazelnut extract",
        "triggered his hazelnut allergy",
      ],
      concepts: [["hazelnut"], ["espresso", "coffee", "cup"]],
    },
    motive: {
      aliases: [
        "cover up embezzlement",
        "hide the missing vendor refunds",
        "stop the audit",
        "conceal her theft",
        "prevent the audit exposing stolen money",
      ],
      concepts: [
        ["audit", "refund"],
        ["embezzlement", "stolen", "theft", "missing"],
      ],
    },
    reconstruction:
      "Elise Harrow bought hazelnut extract, crossed behind the counter while Mina was in the loading bay, and contaminated Gabriel's unattended espresso. The next morning's audit would have exposed vendor refunds diverted through Elise's login.",
  },
  "the-blackthorn-ledger": {
    culprit: {
      aliases: ["mara voss", "mara", "voss", "m voss", "ms voss"],
    },
    method: {
      aliases: [
        "gasoline utility pump",
        "carbon monoxide through the archive vent",
        "pump exhaust through the return vent",
        "exhaust from eq 017",
      ],
      concepts: [
        ["pump", "eq 017"],
        ["exhaust", "carbon monoxide", "co"],
        ["vent", "hatch", "return air"],
      ],
    },
    motive: {
      aliases: [
        "hide the 94600 diversion",
        "conceal shell vendor payments",
        "cover up embezzlement",
        "protect the px 9044 payment scheme",
      ],
      concepts: [
        ["shell", "vendor", "px 9044"],
        ["embezzlement", "diversion", "payments", "94600"],
      ],
    },
    reconstruction:
      "Mara Voss positioned gasoline pump EQ-017 beside the archive return-air hatch during her fourteen-minute service-level visit. Its exhaust killed Rook before he could expose $94,600 routed to two shell vendors sharing payout account PX-9044.",
  },
  "midnight-at-pier-nine": {
    culprit: {
      aliases: ["celia rook", "celia", "rook", "lark 09", "lark09"],
    },
    method: {
      aliases: [
        "s 17 sedation followed by an n 9 atmosphere purge",
        "sedated her and purged the chamber",
        "s17 and oxygen deprivation",
      ],
      concepts: [
        ["s 17", "s17", "sedative", "sedated"],
        ["n 9", "n9", "chamber"],
        ["purge", "oxygen deprivation", "inert atmosphere"],
        ["interlock", "bypass", "occupancy sensor"],
      ],
    },
    motive: {
      aliases: [
        "revenge for aster house and prevention of lark 09 exposure",
        "revenge and stop vale exposing her identity",
        "aster house revenge",
      ],
      concepts: [
        ["revenge", "aster", "abuse"],
        ["lark 09", "lark09", "identity", "survivor"],
        ["expose", "exposure", "publish", "blackmail", "leverage"],
      ],
    },
    reconstruction:
      "Celia Rook was LARK-09, the surviving child Vale intended to expose and monetize. Rook removed S-17, sedated Vale, bypassed N-9's occupancy interlock, started the purge, and played SESSION-14. She made Vale die inside a reality controlled by somebody else, repeating Aster House's central cruelty.",
  },
  "manor": {
    culprit: {
      aliases: ["victoria pemberton", "victoria", "pemberton"],
    },
    method: {
      aliases: [
        "blunt force with a bookend",
        "struck with a bronze bookend",
        "killed with a bookend",
      ],
      concepts: [
        ["bookend", "bronze", "blunt force"],
        ["library", "ladder", "second floor"],
      ],
    },
    motive: {
      aliases: [
        "forged will",
        "debt to the victim",
        "inheritance fraud",
      ],
      concepts: [
        ["will", "forge", "inheritance"],
        ["debt", "money", "owed"],
      ],
    },
    reconstruction:
      "Victoria Pemberton killed Lord Havisham with a bronze bookend in the library. Her monocle chain snagged on the library ladder as she fled along the second-floor corridor. She had been forging a will to claim an inheritance, and Havisham discovered the fraud.",
  },
  "nordkapp-fjord": {
    culprit: {
      aliases: ["karl antonsen", "karl", "antonsen"],
    },
    method: {
      aliases: [
        "rammed the barge with his boat",
        "collision with skarven",
        "struck the barge at sea",
      ],
      concepts: [
        ["ram", "collision", "struck", "hit"],
        ["skarven", "barge", "fjordbris"],
      ],
    },
    motive: {
      aliases: [
        "undeclared fish quotas",
        "illegal fishing",
        "fled with navigation lights off",
      ],
      concepts: [
        ["fish", "quota", "illegal", "undisclosed"],
        ["lights", "fled", "escape"],
      ],
    },
    reconstruction:
      "Karl Antonsen's boat Skarven left Kjollefjord at 21:20 and was in the barge lane at 23:10, two minutes before MS Fjordbris was struck. Blue hull paint in the barge rail matches Skarven, and the bent bronze propeller fragment fits her 420 hp diesel. Antonsen had been running undeclared fish quotas with his navigation lights off and fled after the collision.",
  },
  "the-bellweather-murder": {
    culprit: {
      aliases: ["vivienne shaw", "vivienne", "shaw"],
    },
    method: {
      aliases: [
        "blow with a bronze bookend",
        "struck with a bronze bell bookend",
        "blunt force trauma",
      ],
      concepts: [
        ["bookend", "bronze", "bell"],
        ["blunt force", "trauma", "struck"],
      ],
    },
    motive: {
      aliases: [
        "ledger protects both of us",
        "blackmail over the ledger",
        "conceal the ledger contents",
      ],
      concepts: [
        ["ledger", "blackmail", "conceal"],
        ["protect", "both", "us"],
      ],
    },
    reconstruction:
      "Vivienne Shaw arrived at the Bellweather Hotel at 23:12, parked her burgundy Buick under token H-173. She went to suite 404 to confront Conrad Bell about the ledger. The confrontation turned violent. Shaw struck Bell with a bronze bookend, took the ledger, and fled down the service stairs at 23:47. Her emerald wool coat left a fibre on the stair latch, and her No. 7 bergamot-clove cigarette ash was found on the carpet.",
  },
  "thesis": {
    culprit: {
      aliases: ["sofia lindqvist", "sofia", "lindqvist"],
    },
    method: {
      aliases: [
        "forced entry and stole the thesis",
        "broke into office b-12",
        "stole the printed thesis and backup drive",
      ],
      concepts: [
        ["forced", "entry", "break", "broke"],
        ["thesis", "printed", "original", "drive"],
        ["b-12", "office"],
      ],
    },
    motive: {
      aliases: [
        "stole her supervisor's other student's work",
        "theft of academic work",
        "plagiarism",
      ],
      concepts: [
        ["supervisor", "student", "work"],
        ["thesis", "stole", "theft"],
      ],
    },
    reconstruction:
      "Sofia Lindqvist entered office B-12 at 02:31 using her card L-0388, forced the door, and took the printed original of her supervisor's other student's thesis plus the backup drive. At 03:12 she printed a decoy cover page at the STAIRWELL-2 printer to create a false trail. The card reader log and print job timestamp confirm the same person committed both actions.",
  },
  "midnight-library": {
    culprit: {
      aliases: ["ingrid solberg", "ingrid", "solberg"],
    },
    method: {
      aliases: [
        "struck with a bronze bookend",
        "blunt force with the raven bookend",
        "killed with the bronze raven bookend",
      ],
      concepts: [
        ["bookend", "bronze", "raven"],
        ["blunt force", "struck", "trauma"],
      ],
    },
    motive: {
      aliases: [
        "curator position given to marcus",
        "revenge for losing curator position",
        "furious about the curator position",
      ],
      concepts: [
        ["curator", "position", "marcus"],
        ["furious", "revenge", "lost"],
      ],
    },
    reconstruction:
      "Ingrid Solberg's gym membership 48Z21 matched the torn checkout slip. Her keycard 901 entered the Rare Books Room at 23:18 and exited at 23:40. She was the last borrower of the Bronze Raven Bookend, which was found missing. Her red hair and dark Volvo (BER-4099) matched the witness description. She killed Blackwell out of fury over the curator position he gave to Marcus Vane instead of her.",
  },
  "deed-and-probate": {
    culprit: {
      aliases: ["solveig brandt", "solveig"],
    },
    method: {
      aliases: [
        "sedated her wine",
        "chloral hydrate in the wine",
        "poisoned the wine with a sedative",
      ],
      concepts: [
        ["sedative", "chloral", "hydrate", "wine"],
        ["poison", "drugged"],
      ],
    },
    motive: {
      aliases: [
        "cover up the forged deed",
        "hide the manor transfer",
        "prevent astrid from changing the will",
      ],
      concepts: [
        ["deed", "forge", "manor", "transfer"],
        ["will", "change", "disinherit"],
      ],
    },
    reconstruction:
      "Solveig Brandt forged a deed on 20 May 2024 that transferred Brandt Manor to herself, then mortgaged it the next day. Astrid discovered the fraud and prepared new will pages that would expose and disinherit her daughter. Solveig sedated her mother's wine with chloral hydrate, removed those pages and staged a break-in with the gardener's boots. The latch was forced from inside, Astrid's signature was traced, and both suspicious filings were made by Solveig.",
  },
  "coffee": {
    culprit: {
      aliases: ["marta ilves", "marta", "ilves"],
    },
    method: {
      aliases: [
        "arsenic in the oat milk",
        "poisoned the oat milk with rodenticide",
        "contaminated the carton with arsenic",
      ],
      concepts: [
        ["arsenic", "rodenticide", "poison"],
        ["oat milk", "carton", "fridge"],
      ],
    },
    motive: {
      aliases: [
        "revenge for the lab safety report",
        "kane signed against her",
        "grudge over safety report",
      ],
      concepts: [
        ["safety", "report", "signed"],
        ["grudge", "revenge", "against"],
      ],
    },
    reconstruction:
      "Marta Ilves, laboratory technician, had the keys and the rubber gloves. She bought RatX rodenticide pellets from GreenLeaf Garden Supply on 8 May. On Thursday she was on kitchen duty and had access to the storeroom fridge where the sealed oat milk carton was delivered. She contaminated the carton with arsenic. Kane was the only person to order oat milk that morning.",
  },
  "lighthouse-keepers-demise": {
    culprit: {
      aliases: ["ottar ruud", "ottar", "ruud", "geir foss", "geir"],
    },
    method: {
      aliases: [
        "confrontation on the tower",
        "pushed from the cliff",
        "fatal confrontation at the lighthouse",
      ],
      concepts: [
        ["confrontation", "tower", "cliff", "push"],
        ["lighthouse", "fight", "struggle"],
      ],
    },
    motive: {
      aliases: [
        "inheritance fraud",
        "ruud ordered the killing to protect his inheritance",
        "stig was about to contest the will",
      ],
      concepts: [
        ["inheritance", "will", "contest"],
        ["ruud", "ordered", "paid", "fraud"],
      ],
    },
    reconstruction:
      "Stig Kran was about to contest his late uncle's will, which would have cost Ottar Ruud a large inheritance. Ruud hired Geir Foss — a courier in network AG-4471 — to recover the letter Stig carried. The camera logs prove Geir lied: he claimed he turned back before the lighthouse, but the East Lighthouse Road camera caught him walking away from the tower at 22:34, three minutes before Stig's watch stopped at 22:37. The grease-stained raincoat ties the scene to the delivery van Geir drove, and the phone records tie Geir to Ottar. Confronted, Geir confessed: the confrontation on the tower turned fatal — and Ottar Ruud ordered and paid for all of it.",
  },
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("en")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function matches(value: string, field: SolutionField): boolean {
  const normalized = normalize(value);

  if (field.aliases.some((alias) => normalized === normalize(alias))) {
    return true;
  }

  return Boolean(
    field.concepts?.every((group) =>
      group.some((concept) => normalized.includes(normalize(concept))),
    ),
  );
}

export function checkVerdict(
  slug: CaseSlug,
  payload: VerdictPayload,
): VerdictResult {
  const solution = SOLUTIONS[slug];
  const solved = matches(payload.culprit, solution.culprit);

  return {
    solved,
    message: solved
      ? "The evidence holds. Case closed."
      : "That name does not hold up under the evidence. Keep digging.",
    reconstruction: solved ? solution.reconstruction : undefined,
  };
}
