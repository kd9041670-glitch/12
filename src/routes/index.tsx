import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase, imageUrl, formatDZD, arError, type Product } from "@/lib/wasl";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "وصل | Wasl Delivery — تسوّق واطلب بالدفع عند الاستلام" },
      { name: "description", content: "متجر وصل: منتجات مختارة بأسعار بالدينار الجزائري وتوصيل مع الدفع عند الاستلام." },
      { property: "og:title", content: "وصل | Wasl Delivery" },
      { property: "og:description", content: "تسوّق بسهولة واطلب مع الدفع عند الاستلام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Store,
});

type Cart = Record<string, number>;

function Store() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [open, setOpen] = useState(false);

  const load = async () => {
    setError(null);
    setProducts(null);
    const { data, error } = await supabase
      .from("wasl_products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) setError(arError(error));
    else setProducts((data ?? []) as Product[]);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      (products ?? []).filter((p) =>
        `${p.name} ${p.description ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [products, q],
  );
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <button onClick={() => setOpen(true)} className="btn-primary relative">
            السلة
            {count > 0 && (
              <span className="absolute -top-2 -left-2 grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <section className="hero-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <p className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">
            الدفع عند الاستلام
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
            كل ما تحتاجه، يصلك حتى بابك
          </h1>
          <p className="mt-4 max-w-xl text-lg text-primary-foreground/80">
            اختر منتجاتك، أضفها إلى السلة، واطلب في أقل من دقيقة.
          </p>
          <div className="mt-8 max-w-lg">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="input h-13 text-base"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {error ? (
          <div className="card p-8 text-center">
            <p className="text-destructive">{error}</p>
            <button onClick={load} className="btn-primary mt-4">إعادة المحاولة</button>
          </div>
        ) : products === null ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-72 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            {products.length === 0 ? "لا توجد منتجات متاحة حاليًا." : "لا توجد نتائج مطابقة لبحثك."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => {
              const img = imageUrl(p.image_path);
              return (
                <article key={p.id} className="card group flex flex-col overflow-hidden">
                  <div className="aspect-square overflow-hidden bg-muted">
                    {img ? (
                      <img src={img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full place-items-center text-4xl text-muted-foreground">و</div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3 md:p-4">
                    <h3 className="font-bold leading-snug">{p.name}</h3>
                    {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <span className="font-display text-lg font-extrabold text-primary">{formatDZD(p.price_dzd)}</span>
                      <button onClick={() => add(p.id)} className="btn-accent px-3 py-2 text-sm">أضف</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} وصل | Wasl Delivery
      </footer>

      {open && <CartDrawer products={products ?? []} cart={cart} setCart={setCart} onClose={() => setOpen(false)} />}
    </div>
  );
}

function CartDrawer({
  products,
  cart,
  setCart,
  onClose,
}: {
  products: Product[];
  cart: Cart;
  setCart: (f: (c: Cart) => Cart) => void;
  onClose: () => void;
}) {
  const items = Object.entries(cart)
    .map(([id, qty]) => ({ p: products.find((x) => x.id === id), qty }))
    .filter((x): x is { p: Product; qty: number } => !!x.p && x.qty > 0);
  const total = items.reduce((s, i) => s + i.p.price_dzd * i.qty, 0);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const setQty = (id: string, d: number) =>
    setCart((c) => {
      const n = { ...c, [id]: Math.max(0, (c[id] ?? 0) + d) };
      if (n[id] === 0) delete n[id];
      return n;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) return setErr("يرجى ملء الاسم والهاتف والعنوان.");
    if (!/^[0-9+\s]{9,15}$/.test(form.phone.trim())) return setErr("رقم الهاتف غير صالح.");
    setBusy(true);
    const { error } = await supabase.rpc("wasl_place_order", {
      p_name: form.name.trim(),
      p_phone: form.phone.trim(),
      p_address: form.address.trim(),
      p_notes: form.notes.trim(),
      p_items: items.map((i) => ({ product_id: i.p.id, quantity: i.qty })),
    });
    setBusy(false);
    if (error) return setErr(arError(error));
    setDone(true);
    setCart(() => ({}));
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/40" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-xl font-bold">سلة المشتريات</h2>
          <button onClick={onClose} className="btn-ghost" aria-label="إغلاق">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {done ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-accent text-3xl text-accent-foreground">✓</div>
              <h3 className="font-display text-xl font-bold">تم استلام طلبك بنجاح</h3>
              <p className="mt-2 text-muted-foreground">سنتصل بك قريبًا لتأكيد الطلب.</p>
              <button onClick={onClose} className="btn-primary mt-6">متابعة التسوق</button>
            </div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">السلة فارغة.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {items.map(({ p, qty }) => (
                  <li key={p.id} className="card flex items-center gap-3 p-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {imageUrl(p.image_path) && <img src={imageUrl(p.image_path)!} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-primary">{formatDZD(p.price_dzd * qty)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQty(p.id, 1)} className="qty">+</button>
                      <span className="w-5 text-center font-bold">{qty}</span>
                      <button onClick={() => setQty(p.id, -1)} className="qty">−</button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="my-4 flex justify-between rounded-2xl bg-secondary p-4 font-bold">
                <span>المجموع التقديري</span>
                <span className="text-primary">{formatDZD(total)}</span>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <input className="input" placeholder="الاسم الكامل *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
                <input className="input" placeholder="رقم الهاتف *" inputMode="tel" dir="ltr" style={{ textAlign: "right" }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input className="input" placeholder="العنوان (الولاية، البلدية، الحي) *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={300} />
                <textarea className="input min-h-20 py-2" placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={500} />
                <p className="text-sm text-muted-foreground">طريقة الدفع: الدفع عند الاستلام. يُحتسب المجموع النهائي على الخادم.</p>
                {err && <p className="text-sm text-destructive">{err}</p>}
                <button disabled={busy} className="btn-primary w-full py-3">{busy ? "جارٍ إرسال الطلب..." : "تأكيد الطلب"}</button>
              </form>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}