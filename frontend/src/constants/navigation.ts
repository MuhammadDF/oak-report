import { AppRole, Screen } from "../types/app";

export const NAV_ITEMS: Array<{
  id: Screen;
  label: string;
  mobileLabel: string;
  icon: string;
  visibleTo?: AppRole[];
}> = [
  { id: "appraise", label: "Appraise", mobileLabel: "Scan", icon: "◎" },
  { id: "collection", label: "Collection", mobileLabel: "Collection", icon: "▣" },
  // { id: "library", label: "Library", mobileLabel: "Library", icon: "◍" },
  {
    id: "admin",
    label: "Admin",
    mobileLabel: "Admin",
    icon: "◈",
    visibleTo: ["admin"],
  },
  { id: "profile", label: "Profile", mobileLabel: "Profile", icon: "◌" },
];
