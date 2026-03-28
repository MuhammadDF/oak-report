import { CollectionCard, LibraryCard } from "../types/app";

export const COLLECTION_CARDS: CollectionCard[] = [
  {
    id: "1",
    name: "Charizard VMAX",
    set: "Shining Fates",
    number: "SV107/SV122",
    price: 184.99,
    trend: "up",
    trendPct: 12.3,
    image:
      "https://images.unsplash.com/photo-1613771404738-65d22f979710?auto=format&fit=crop&w=900&q=80",
    grade: "PSA 9",
  },
  {
    id: "2",
    name: "Pikachu VMAX",
    set: "Vivid Voltage",
    number: "044/185",
    price: 312.0,
    trend: "up",
    trendPct: 5.1,
    image:
      "https://images.unsplash.com/photo-1611931969235-9ad843243189?auto=format&fit=crop&w=900&q=80",
    grade: "PSA 10",
  },
  {
    id: "3",
    name: "Umbreon VMAX",
    set: "Evolving Skies",
    number: "215/203",
    price: 245.5,
    trend: "up",
    trendPct: 18.4,
    image:
      "https://images.unsplash.com/photo-1647893977173-59619da505d9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "4",
    name: "Mew VMAX",
    set: "Fusion Strike",
    number: "269/264",
    price: 67.3,
    trend: "down",
    trendPct: 3.2,
    image:
      "https://images.unsplash.com/photo-1595428316542-6ce94f69a02d?auto=format&fit=crop&w=900&q=80",
  },
];

export const LIBRARY_CARDS: LibraryCard[] = [
  {
    id: "l1",
    name: "Charizard ex",
    set: "Obsidian Flames",
    number: "223/197",
    rarity: "Special Art Rare",
    type: "Fire",
    price: 89.99,
  },
  {
    id: "l2",
    name: "Mewtwo ex",
    set: "SV 151",
    number: "191/165",
    rarity: "Special Art Rare",
    type: "Psychic",
    price: 67.0,
  },
  {
    id: "l3",
    name: "Giratina VSTAR",
    set: "Lost Origin",
    number: "131/196",
    rarity: "Ultra Rare",
    type: "Dragon",
    price: 28.5,
  },
  {
    id: "l4",
    name: "Blastoise ex",
    set: "Paldea Evolved",
    number: "239/193",
    rarity: "Special Art Rare",
    type: "Water",
    price: 48.0,
  },
];
