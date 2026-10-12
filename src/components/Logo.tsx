import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

// Three clicks within 2s navigate to /dashboard. Real protection is Auth + RLS.
export function Logo() {
  const navigate = useNavigate();
  const clicks = useRef<number[]>([]);
  const onClick = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 2000), now];
    if (clicks.current.length >= 3) {
      clicks.current = [];
      navigate({ to: "/dashboard" });
    }
  };
  return (
    <button onClick={onClick} className="flex select-none items-center gap-2" aria-label="وصل">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary font-display text-xl font-extrabold text-primary-foreground shadow-soft">
        و
      </span>
      <span className="leading-tight text-right">
        <span className="block font-display text-2xl font-extrabold text-primary">وصل</span>
        <span className="block text-[11px] tracking-widest text-muted-foreground">WASL DELIVERY</span>
      </span>
    </button>
  );
}