import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CaseNotebook } from "@/components/case-notebook";
import { CASE_SLUGS, getCase } from "@/lib/cases";
import { getCaseSchema } from "@/lib/server/database";

export function generateStaticParams() {
  return CASE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await props.params;
  const mystery = getCase(slug);
  if (!mystery) return {};

  return {
    title: mystery.title,
    description: mystery.subtitle,
  };
}

export default async function CasePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const mystery = getCase(slug);
  if (!mystery) notFound();

  const schema = getCaseSchema(mystery.slug);
  
  return <CaseNotebook mystery={mystery} schema={schema} />;
}
