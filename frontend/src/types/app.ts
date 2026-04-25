export type AppRole = "na" | "collector" | "admin";

export type Screen =
  | "appraise"
  | "collection"
  | "library"
  | "profile"
  | "admin"
  | "access_required"
  | "signin";

export type ThemeMode = "dark" | "light";

export type ScanResult = {
  processed_at: string;
  card: {
    name: string;
    card_number?: string | null;
    language?: string | null;
  };
  image_url?: string | null;
  set_name?: string | null;
  pricing: number;
};

export type CollectionCard = {
  id: string;
  name: string;
  set: string;
  number: string;
  price: number;
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

export type CardPricingMatch = {
  id: string;
  console_name: string;
  product_name: string;
  loose_price: number;
  tcg_id?: string | null;
  image_url: string;
  refreshed_at: string;
};

export type CardPricingMatchResponse = {
  results: CardPricingMatch[];
};

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  role: AppRole;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type AdminUserRecord = {
  id: string;
  display_name: string;
  email: string;
  role: AppRole;
};

export type AdminUserPage = {
  items: AdminUserRecord[];
  page: number;
  page_size: number;
  total: number;
};
