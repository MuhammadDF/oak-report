import { Screen } from "../types/app";

export const NAV_ITEMS: Array<{
  id: Screen;
  label: string;
  mobileLabel: string;
  icon: string;
}> = [
  { id: "appraise", label: "Appraise", mobileLabel: "Scan", icon: "◎" },
  { id: "collection", label: "Collection", mobileLabel: "Collection", icon: "▣" },
  { id: "profile", label: "Profile", mobileLabel: "Profile", icon: "◌" },
];
