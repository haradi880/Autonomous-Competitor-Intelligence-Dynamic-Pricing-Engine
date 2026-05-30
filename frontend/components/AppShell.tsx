"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AlertTriangle, BookOpen, Boxes, Circle, Crosshair, FileCheck2, Gauge } from "lucide-react";

const navItems = [
  { href: "/", label: "Command", short: "Home", icon: <Gauge size={18} /> },
  { href: "/products", label: "Products", short: "Products", icon: <Boxes size={18} /> },
  { href: "/competitors", label: "Competitors", short: "Targets", icon: <Crosshair size={18} /> },
  { href: "/scans", label: "Scans", short: "Scans", icon: <Activity size={18} /> },
  { href: "/alerts", label: "Alerts", short: "Alerts", icon: <AlertTriangle size={18} /> },
  { href: "/readiness", label: "Readiness", short: "Ready", icon: <FileCheck2 size={18} /> },
  { href: "/about", label: "Documentation", short: "Docs", icon: <BookOpen size={18} /> }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e5f5ee,transparent_30%),radial-gradient(circle_at_top_right,#eeedff,transparent_24%),#f7faf9] pb-20 lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-ink px-4 py-5 text-white lg:block">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Project A</p>
          <h1 className="mt-1 text-xl font-semibold leading-tight">Pricing Operations</h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <Circle size={9} className="fill-fern text-fern" />
            Systems online
          </div>
        </div>
        <nav className="mt-5 space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                  active ? "bg-white text-ink shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={active ? "text-fern" : "text-white/60"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/82 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Pricing Ops</p>
            <p className="truncate text-base font-semibold">Autonomous Command</p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-fern/20 bg-fern/10 px-3 py-1 text-xs font-semibold text-fern">
            <Circle size={8} className="fill-fern" />
            Live
          </div>
        </div>
      </header>

      <main className="lg:pl-72">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/90 px-2 py-2 shadow-[0_-12px_40px_rgba(23,33,38,0.12)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <div className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`grid min-w-[4.25rem] place-items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition ${
                  active ? "bg-ink text-white" : "text-ink/55"
                }`}
              >
                {item.icon}
                <span className="truncate">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
