import { LeadDetail } from "@/components/crm/lead-detail";

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  return <LeadDetail id={id} />;
}
