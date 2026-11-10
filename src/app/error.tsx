"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="p-10">
      <h1 className="text-xl font-bold">Could not load this page</h1>
      <p className="my-4">
        Try again. If it keeps failing, contact an administrator.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
