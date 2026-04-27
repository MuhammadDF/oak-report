import { describe, expect, it } from "vitest";
import { NAV_ITEMS } from "./navigation";

describe("NAV_ITEMS", () => {
  it("includes the expected app navigation structure", () => {
    expect(NAV_ITEMS).toEqual([
      { id: "appraise", label: "Appraise", mobileLabel: "Scan", icon: "◎" },
      { id: "collection", label: "Collection", mobileLabel: "Collection", icon: "▣" },
      {
        id: "admin",
        label: "Admin",
        mobileLabel: "Admin",
        icon: "◈",
        visibleTo: ["admin"],
      },
      { id: "profile", label: "Profile", mobileLabel: "Profile", icon: "◌" },
    ]);
  });
});
