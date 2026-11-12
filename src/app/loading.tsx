import { LoaderCircle } from "lucide-react";
export default function Loading() {
  return (
    <output className="block p-10 text-[#4F5E4B]">
      <LoaderCircle className="animate-spin" /> Loading CRM…
    </output>
  );
}
