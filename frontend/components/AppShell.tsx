"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, AlertTriangle, Boxes, ChevronLeft, ChevronRight, Circle, Crosshair, FileCheck2, Gauge, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Command Center", icon: <Gauge size={18} /> },
  { href: "/products", label: "Products", icon: <Boxes size={18} /> },
  { href: "/competitors", label: "Competitors", icon: <Crosshair size={18} /> },
  { href: "/scans", label: "Scans", icon: <Activity size={18} /> },
  { href: "/alerts", label: "Alerts", icon: <AlertTriangle size={18} /> },
  { href: "/readiness", label: "Readiness", icon: <FileCheck2 size={18} /> }
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const nav = (
    <nav className="mt-6 space-y-1" aria-label="Primary navigation">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${
              active ? "bg-white text-ink shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className={active ? "text-fern" : "text-white/60 group-hover:text-white"}>{item.icon}</span>
            {!collapsed ? <span>{item.label}</span> : null}
            {active ? <motion.span layoutId="active-nav" className="absolute inset-y-2 left-0 w-1 rounded-r bg-fern" /> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff1e9,transparent_32%),radial-gradient(circle_at_top_right,#eceaff,transparent_26%),#f7faf9]">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-md border border-ink/10 bg-white shadow md:hidden"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/35 p-3 backdrop-blur-md md:hidden"
          >
            <motion.aside
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mx-auto max-h-[calc(100vh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-ink px-4 py-4 text-white shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-white/45">Pricing Ops</p>
                  <p className="text-lg font-semibold">Command Center</p>
                </div>
                <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-md bg-white/10">
                  <X size={18} />
                </button>
              </div>
              {nav}
              <div className="mt-5 rounded-xl border border-white/10 bg-white/10 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                  <Circle size={9} className="fill-fern text-fern" />
                  Systems online
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden bg-ink px-3 py-5 text-white transition-all md:block ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-2">
          {!collapsed ? (
            <div>
              <p className="text-xs font-semibold uppercase text-white/45">Project A</p>
              <p className="text-lg font-semibold leading-tight">Pricing Operations</p>
            </div>
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-md bg-white text-ink">
              <Gauge size={20} />
            </div>
          )}
          <button
            type="button"
            aria-label="Collapse navigation"
            onClick={() => setCollapsed((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-md bg-white/10 text-white"
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>
        {nav}
        <div className="absolute inset-x-3 bottom-4 rounded-xl border border-white/10 bg-white/10 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <Circle size={9} className="fill-fern text-fern" />
            {!collapsed ? "Systems online" : null}
          </div>
          {!collapsed ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-bold text-ink">AI</div>
              <div>
                <p className="text-sm font-semibold">Pricing Ops</p>
                <p className="text-xs text-white/45">Autonomous console</p>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ease-out ${collapsed ? "md:pl-20" : "md:pl-72"}`}>
        <motion.div
          key={pathname}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.995, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
