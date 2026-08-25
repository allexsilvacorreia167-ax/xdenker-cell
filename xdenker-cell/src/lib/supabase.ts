import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos básicos (serão expandidos)
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category: string;
  images: string[];
  stock: number;
  variations?: {
    colors?: string[];
    storage?: string[];
  };
  featured: boolean;
  active: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string | null;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: any[];
  shipping_address: any;
  payment_method: string;
  created_at: string;
};
