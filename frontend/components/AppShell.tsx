import Link from "next/link";
import { Activity, AlertTriangle, Boxes, Crosshair, FileCheck2, Gauge } from "lucide-react";

const navItems = [
  { href: "/", label: "Command Center", icon: <Gauge size={17} /> },
  { href: "/products", label: "Products", icon: <Boxes size={17} /> },
  { href: "/competitors", label: "Competitors", icon: <Crosshair size={17} /> },
  { href: "/scans", label: "Scans", icon: <Activity size={17} /> },
  { href: "/alerts", label: "Alerts", icon: <AlertTriangle size={17} /> },
  { href: "/readiness", label: "Readiness", icon: <FileCheck2 size={17} /> }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-white px-5 py-4 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Project A Production Console</p>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Autonomous Pricing Command Center</h1>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-10 shrink-0 items-center gap-2 border border-ink/15 bg-mist px-3 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
