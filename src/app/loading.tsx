import { LoaderCircle } from "lucide-react";
export default function Loading() {
  return (
    <output className="fixed top-1/2 left-1/2 z-10 flex w-max max-w-[calc(100vw-2.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-3 rounded-[14px] border border-[#DFE6D6] bg-white p-10 text-center text-[#4F5E4B]">
      <LoaderCircle className="animate-spin" aria-hidden="true" />
      Loading CRM…
    </output>
  );
}
