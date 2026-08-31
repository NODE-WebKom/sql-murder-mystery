import type { Metadata } from "next";

import { CaseBoard } from "@/components/case-board";
import { CASE_LIST } from "@/lib/cases";

export const metadata: Metadata = {
  title: "Open Cases",
};

export default function Home() {
  return <CaseBoard cases={CASE_LIST} />;
}
