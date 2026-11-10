import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageHeader, Truncate } from "@/components/crm/shared";

describe("Truncate", () => {
  it("clips to one line with an ellipsis and keeps the full text in a tooltip", () => {
    const longValue = "a".repeat(200);
    const html = renderToStaticMarkup(createElement(Truncate, null, longValue));

    expect(html).toContain("truncate");
    expect(html).toContain(`title="${longValue}"`);
    expect(html).toContain(`>${longValue}</span>`);
  });

  it("adds caller classes without dropping the truncation", () => {
    const html = renderToStaticMarkup(
      Truncate({ className: "max-w-[10px]", children: "value" }),
    );

    expect(html).toContain("truncate");
    expect(html).toContain("max-w-[10px]");
  });
});

describe("PageHeader", () => {
  it("truncates a long title and exposes the full title as a tooltip", () => {
    const title = "L".repeat(120);
    const html = renderToStaticMarkup(
      createElement(PageHeader, { title, description: "Details" }),
    );

    expect(html).toMatch(/<h1[^>]*class="[^"]*truncate/);
    expect(html).toContain(`title="${title}"`);
  });
});
