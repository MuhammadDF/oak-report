import { Screen } from "../types/app";

export const NAV_ITEMS: Array<{
  id: Screen;
  label: string;
  mobileLabel: string;
  icon: string;
}> = [
  { id: "appraise", label: "Appraise", mobileLabel: "Scan", icon: "◎" },
  { id: "collection", label: "Memory Bank", mobileLabel: "Collection", icon: "▣" },
  { id: "library", label: "Library", mobileLabel: "Library", icon: "⌕" },
  { id: "settings", label: "Settings", mobileLabel: "Settings", icon: "◌" },
];
