# وصل | Wasl Delivery

متجر عربي (RTL) مع لوحة إدارة على `/dashboard` (الوصول الخفي: ثلاث نقرات على شعار "وصل" خلال ثانيتين). الحماية الفعلية عبر Supabase Auth + RLS + جدول `wasl_admins`.

- يستخدم مشروع Supabase موجود مسبقًا بمفتاح publishable فقط (لا service_role ولا أسرار).
- الطلبات عبر RPC `wasl_place_order` ويحسب الخادم المجموع.

## التصدير/المزامنة إلى GitHub (`kd9041670-glitch/12`)

> لا تُرفع الملفات تلقائيًا. نفّذ الخطوات بعد التأكيد فقط، وانتبه: الربط قد يستبدل محتوى المستودع.

**الطريقة الموصى بها (من Lovable):**
1. في محرر Lovable افتح **Connectors → GitHub** واربط حسابك.
2. اختر إنشاء مستودع جديد، أو صدّر الملفات يدويًا إلى المستودع الموجود (انظر أدناه).

**يدويًا إلى المستودع الموجود:**
```bash
git clone https://github.com/kd9041670-glitch/12.git wasl && cd wasl
git checkout -b lovable-sync            # فرع منفصل لتجنّب استبدال الملفات
# انسخ ملفات المشروع (بدون node_modules و dist و .git) إلى هذا المجلد
git add . && git commit -m "Sync Wasl Delivery from Lovable"
git push -u origin lovable-sync         # ثم افتح Pull Request وراجع قبل الدمج
```

## التشغيل محليًا
```bash
bun install && bun run dev
```