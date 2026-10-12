import { createClient } from "@supabase/supabase-js";

// Publishable key is safe in client code; protection is via RLS + Auth.
export const SUPABASE_URL = "https://juqynlhmcyqygnfgyppr.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_HBciQx-rh8m3QkH4E24Onw_UWqjxlZ1";

export const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { persistSession: typeof window !== "undefined", autoRefreshToken: true },
});

export const BUCKET = "wasl-products";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_dzd: number;
  image_path: string | null;
  active: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  total_dzd: number;
  status: string;
  created_at: string;
};

export function imageUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function formatDZD(n: number) {
  return `${Number(n || 0).toLocaleString("ar-DZ")} د.ج`;
}

export const ORDER_STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "confirmed", label: "مؤكَّد" },
  { value: "shipping", label: "قيد التوصيل" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغى" },
];

export function arError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login/i.test(msg)) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (/fetch|network/i.test(msg)) return "تعذّر الاتصال بالخادم. تحقّق من الإنترنت وحاول مجددًا.";
  if (/row-level security|permission/i.test(msg)) return "ليست لديك صلاحية لتنفيذ هذا الإجراء.";
  return `حدث خطأ: ${msg}`;
}