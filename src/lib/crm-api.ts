import { useCallback, useEffect, useState } from "react";

export async function readApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof result === "object" &&
        result !== null &&
        "error" in result &&
        typeof result.error === "string"
        ? result.error
        : "The request failed. Try again.",
    );
  }
  return result as T;
}

export async function readCollection<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await readApi<{ data: T[]; total: number }>(
      `${path}?limit=100&offset=${offset}`,
      { signal },
    );
    rows.push(...page.data);
    if (rows.length >= page.total || page.data.length === 0) return rows;
  }
}

export function useCollection<T>(path: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    void revision;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    readCollection<T>(path, controller.signal)
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Could not load CRM data", cause);
        setError("Could not load data. Try again.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [path, revision]);

  return { rows, loading, error, refresh };
}
