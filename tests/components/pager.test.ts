import { describe, expect, it } from "vitest";
import { buildPagerPageItems } from "@/components/crm/shared";

const page = (value: number) => ({ kind: "page" as const, page: value });
const ellipsis = (id: "leading" | "trailing") => ({
  kind: "ellipsis" as const,
  id,
});

describe("buildPagerPageItems", () => {
  it("returns a single page when there is only one page", () => {
    expect(buildPagerPageItems(1, 1)).toEqual([page(1)]);
  });

  it("lists every page when there are at most seven", () => {
    expect(buildPagerPageItems(3, 7)).toEqual([
      page(1),
      page(2),
      page(3),
      page(4),
      page(5),
      page(6),
      page(7),
    ]);
  });

  it("shows the first five pages, an ellipsis, and the last page near the start", () => {
    expect(buildPagerPageItems(3, 20)).toEqual([
      page(1),
      page(2),
      page(3),
      page(4),
      page(5),
      ellipsis("trailing"),
      page(20),
    ]);
  });

  it("truncates pages before the current page back to the first page in the middle", () => {
    expect(buildPagerPageItems(10, 20)).toEqual([
      page(1),
      ellipsis("leading"),
      page(9),
      page(10),
      page(11),
      ellipsis("trailing"),
      page(20),
    ]);
  });

  it("shows the last five pages with a leading ellipsis near the end", () => {
    expect(buildPagerPageItems(18, 20)).toEqual([
      page(1),
      ellipsis("leading"),
      page(16),
      page(17),
      page(18),
      page(19),
      page(20),
    ]);
  });
});
