import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, imageUrl, formatDZD, arError, BUCKET, ORDER_STATUSES, type Product, type Order } from "@/lib/wasl";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | وصل" },
      { name: "description", content: "إدارة منتجات وطلبات متجر وصل." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "لوحة الإدارة | وصل" },
      { property: "og:description", content: "إدارة منتجات وطلبات متجر وصل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsAdmin(null);
    if (!session) return;
    supabase
      .from("wasl_admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (session === undefined) return <Center>جارٍ التحميل...</Center>;
  if (!session) return <Login />;
  if (isAdmin === null) return <Center>جارٍ التحقق من الصلاحيات...</Center>;
  if (!isAdmin)
    return (
      <Center>
        <p className="text-destructive">هذا الحساب لا يملك صلاحية الإدارة.</p>
        <button className="btn-primary mt-4" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button>
      </Center>
    );
  return <Admin email={session.user.email ?? ""} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center p-4 text-center"><div>{children}</div></div>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(arError(error));
  };
  return (
    <div className="hero-surface grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="font-display text-2xl font-extrabold text-primary">تسجيل الدخول</h1>
        <input className="input" type="email" dir="ltr" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" dir="ltr" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button disabled={busy} className="btn-primary w-full py-3">{busy ? "جارٍ الدخول..." : "دخول"}</button>
        <Link to="/" className="block text-center text-sm text-muted-foreground">العودة إلى المتجر</Link>
      </form>
    </div>
  );
}

function Admin({ email }: { email: string }) {
  const [tab, setTab] = useState<"products" | "orders">("products");
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="font-display text-xl font-extrabold text-primary">لوحة إدارة وصل</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-muted-foreground sm:inline" dir="ltr">{email}</span>
            <Link to="/" className="btn-ghost">المتجر</Link>
            <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>خروج</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-3">
          <button className={tab === "products" ? "btn-primary" : "btn-ghost"} onClick={() => setTab("products")}>المنتجات</button>
          <button className={tab === "orders" ? "btn-primary" : "btn-ghost"} onClick={() => setTab("orders")}>الطلبات</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{tab === "products" ? <Products /> : <Orders />}</main>
    </div>
  );
}

const empty = { name: "", description: "", price_dzd: "", active: true, image_path: null as string | null };

function Products() {
  const [list, setList] = useState<Product[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setErr(null);
    const { data, error } = await supabase.from("wasl_products").select("*").order("created_at", { ascending: false });
    if (error) setErr(arError(error));
    else setList(data as Product[]);
  };
  useEffect(() => {
    load();
  }, []);

  const startEdit = (p?: Product) => {
    setFile(null);
    setErr(null);
    if (p) {
      setEditing(p.id);
      setForm({ name: p.name, description: p.description ?? "", price_dzd: String(p.price_dzd), active: p.active, image_path: p.image_path });
    } else {
      setEditing("new");
      setForm(empty);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price_dzd);
    if (!form.name.trim() || !(price >= 0)) return setErr("يرجى إدخال اسم وسعر صحيح.");
    setBusy(true);
    setErr(null);
    try {
      let image_path = form.image_path;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
        if (error) throw error;
        image_path = path;
      }
      const row = { name: form.name.trim(), description: form.description.trim() || null, price_dzd: price, active: form.active, image_path };
      const { error } =
        editing === "new"
          ? await supabase.from("wasl_products").insert(row)
          : await supabase.from("wasl_products").update(row).eq("id", editing!);
      if (error) throw error;
      setEditing(null);
      await load();
    } catch (e) {
      setErr(arError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`حذف المنتج "${p.name}" نهائيًا؟`)) return;
    const { error } = await supabase.from("wasl_products").delete().eq("id", p.id);
    if (error) setErr(arError(error));
    else load();
  };

  const toggle = async (p: Product) => {
    const { error } = await supabase.from("wasl_products").update({ active: !p.active }).eq("id", p.id);
    if (error) setErr(arError(error));
    else load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">المنتجات</h2>
        <button className="btn-accent" onClick={() => startEdit()}>+ منتج جديد</button>
      </div>
      {err && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}

      {editing && (
        <form onSubmit={save} className="card mb-6 grid gap-3 p-4 md:grid-cols-2">
          <input className="input" placeholder="اسم المنتج *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="number" min="0" placeholder="السعر بالدينار *" value={form.price_dzd} onChange={(e) => setForm({ ...form, price_dzd: e.target.value })} />
          <textarea className="input min-h-20 py-2 md:col-span-2" placeholder="الوصف" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-3 text-sm">
            {(file || form.image_path) && (
              <img src={file ? URL.createObjectURL(file) : imageUrl(form.image_path)!} alt="" className="h-14 w-14 rounded-xl object-cover" />
            )}
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            منشور (ظاهر للزبائن)
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button disabled={busy} className="btn-primary">{busy ? "جارٍ الحفظ..." : "حفظ"}</button>
            <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>إلغاء</button>
          </div>
        </form>
      )}

      {list === null ? (
        <p className="text-muted-foreground">جارٍ تحميل المنتجات...</p>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">لا توجد منتجات بعد.</p>
      ) : (
        <div className="space-y-2">
          {list.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center gap-3 p-3">
              <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted">
                {imageUrl(p.image_path) && <img src={imageUrl(p.image_path)!} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-40 flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-primary">{formatDZD(p.price_dzd)}</p>
              </div>
              <button onClick={() => toggle(p)} className={p.active ? "badge-on" : "badge-off"}>{p.active ? "منشور" : "مخفي"}</button>
              <button className="btn-ghost" onClick={() => startEdit(p)}>تعديل</button>
              <button className="btn-ghost text-destructive" onClick={() => remove(p)}>حذف</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Orders() {
  const [list, setList] = useState<Order[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);

  const load = async () => {
    setErr(null);
    const { data, error } = await supabase.from("wasl_orders").select("*").order("created_at", { ascending: false });
    if (error) setErr(arError(error));
    else setList(data as Order[]);
  };
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (o: Order, status: string) => {
    const { error } = await supabase.from("wasl_orders").update({ status }).eq("id", o.id);
    if (error) setErr(arError(error));
    else setList((l) => l?.map((x) => (x.id === o.id ? { ...x, status } : x)) ?? null);
  };

  const toggleItems = async (id: string) => {
    if (open === id) return setOpen(null);
    setOpen(id);
    setItems(null);
    const { data, error } = await supabase.from("wasl_order_items").select("*").eq("order_id", id);
    setItems(error ? [] : data ?? []);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">الطلبات</h2>
        <button className="btn-ghost" onClick={load}>تحديث</button>
      </div>
      {err && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
      {list === null ? (
        <p className="text-muted-foreground">جارٍ تحميل الطلبات...</p>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground">لا توجد طلبات بعد.</p>
      ) : (
        <div className="space-y-3">
          {list.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{o.customer_name}</p>
                  <p className="text-sm" dir="ltr" style={{ textAlign: "right" }}>{o.phone}</p>
                  <p className="text-sm text-muted-foreground">{o.address}</p>
                  {o.notes && <p className="mt-1 text-sm">ملاحظات: {o.notes}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ar-DZ")}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-display text-lg font-extrabold text-primary">{formatDZD(o.total_dzd)}</span>
                  <select className="input h-10 w-40" value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                    {!ORDER_STATUSES.some((s) => s.value === o.status) && <option value={o.status}>{o.status}</option>}
                    {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button className="text-sm text-primary underline" onClick={() => toggleItems(o.id)}>
                    {open === o.id ? "إخفاء العناصر" : "عرض العناصر"}
                  </button>
                </div>
              </div>
              {open === o.id && (
                <div className="mt-3 rounded-xl bg-secondary p-3 text-sm">
                  {items === null ? "جارٍ التحميل..." : items.length === 0 ? "لا توجد عناصر أو تعذّر تحميلها." : (
                    <ul className="space-y-1">
                      {items.map((it, i) => (
                        <li key={i}>
                          {String(it["product_name"] ?? it["name"] ?? it["product_id"])} × {String(it["quantity"] ?? "")}
                          {it["unit_price_dzd"] != null && ` — ${formatDZD(Number(it["unit_price_dzd"]))}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}