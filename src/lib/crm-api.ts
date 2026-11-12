import { useCallback, useEffect, useState } from "react";

/**
 * Fetches one JSON endpoint and returns the parsed body.
 *
 * The request uses `cache: "no-store"`. Fields on `init` are applied after
 * that, so they can override the cache mode or add a signal, method, or
 * headers. A non-OK response throws `Error`. The message is the response
 * body's `error` string when that field is a string, and
 * `"The request failed. Try again."` otherwise. A successful body is
 * returned as `T` without further checks.
 *
 * @param url Request URL, including any query string.
 * @param init Optional `fetch` options merged onto `{ cache: "no-store" }`.
 * @returns The parsed JSON body, typed as `T`.
 */
export async function callApi<T>(url: string, init?: RequestInit): Promise<T> {
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

/**
 * Loads every row from a paginated collection endpoint.
 *
 * Each page is `GET ${path}?limit=100&offset=…`, parsed by `readApi` as
 * `{ data: T[]; total: number }`. Pages are requested in order and
 * concatenated until the accumulated rows cover `total` or a page returns
 * no rows. `signal` is passed through on every page, so aborting it stops
 * the in-flight request and rejects this call.
 *
 * @param path Collection route, such as `/api/lead`. This function adds
 * the pagination query itself.
 * @param signal Optional abort signal forwarded to each page request.
 * @returns `Promise<T[]>`, the full list in page order.
 */
export async function readCollection<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await callApi<{ data: T[]; total: number }>(
      `${path}?limit=100&offset=${offset}`,
      { signal },
    );
    rows.push(...page.data);
    if (rows.length >= page.total || page.data.length === 0) return rows;
  }
}

/**
 * Loads every row from a paginated collection endpoint into React state.
 *
 * On mount, and again whenever `path` changes, the hook requests pages of
 * 100 from `${path}?limit=100&offset=…` until the accumulated rows cover
 * `total` or a page comes back empty. Calling `refresh` runs that load
 * again. An in-flight request is aborted when `path` changes, `refresh`
 * runs, or the component unmounts. An aborted request is ignored. Any
 * other failure is logged and stored as a short error string. `rows` keeps
 * the last successful value until a later load succeeds.
 *
 * @param path Collection route, such as `/api/lead`. The hook adds the
 * pagination query itself.
 * @returns `{ rows, loading, error, refresh }`.
 * `rows` is `T[]`, empty until the first successful load.
 * `loading` is `boolean`, `true` while a request is in flight, including
 * the first render.
 * `error` is `string`: `""` after a successful load, or
 * `"Could not load data. Try again."` after a failed one.
 * `refresh` is `() => void` and starts another load.
 */
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
    void (async () => {
      try {
        const data = await readCollection<T>(path, controller.signal);
        setRows(data);
        setLoading(false);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        console.error("Could not load CRM data", cause);
        setError("Could not load data. Try again.");
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [path, revision]);

  return { rows, loading, error, refresh };
}
