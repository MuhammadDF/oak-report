export type Screen = "appraise" | "collection" | "profile" | "signin";

export type ThemeMode = "dark" | "light";

export type PricePoint = {
  source: string;
  label: string;
  price: number;
  url: string;
};

export type ScanResult = {
  scan_id: string;
  processed_at: string;
  card: {
    name: string;
    card_number?: string | null;
    language?: string | null;
  };
  image_url?: string | null;
  set_name?: string | null;
  pricing: {
    currency: string;
    estimated_market_value: number;
    price_points: PricePoint[];
  };
};

export type CollectionCard = {
  id: string;
  name: string;
  set: string;
  number: string;
  price: number;
  trend: "up" | "down";
  trendPct: number;
  image: string;
  grade?: string;
  quantity: number;
};

export type LibraryCard = {
  id: string;
  name: string;
  set: string;
  number: string;
  rarity: string;
  type: string;
  price: number;
};

export type CardSearchResult = {
  id: string;
  name: string;
  set: string;
  rarity: string;
  type: string;
  lowest_listing: number;
};

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  role: string;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};
