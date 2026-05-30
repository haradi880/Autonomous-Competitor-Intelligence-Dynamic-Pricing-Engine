"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";
type Toast = { id: string; tone: ToastTone; message: string };
type ToastContextValue = { notify: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo<ToastContextValue>(
    () => ({
      notify(message, tone = "info") {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, tone, message }].slice(-4));
        window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[80] grid w-[min(92vw,380px)] gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              className="flex items-start gap-3 rounded-lg border border-white/70 bg-white/90 p-3 text-sm shadow-lift backdrop-blur"
            >
              <span className={toast.tone === "success" ? "text-fern" : toast.tone === "error" ? "text-coral" : "text-violet"}>
                {toast.tone === "success" ? <CheckCircle2 size={18} /> : toast.tone === "error" ? <AlertCircle size={18} /> : <Info size={18} />}
              </span>
              <p className="min-w-0 flex-1 leading-5 text-ink/75">{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="text-ink/40 hover:text-ink"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
