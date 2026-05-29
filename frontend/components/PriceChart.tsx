"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartPoint } from "@/lib/types";

type Props = {
  data: ChartPoint[];
};

export function PriceChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="border border-ink/10 bg-white p-4">
      <h2 className="mb-4 text-base font-semibold">Pricing Trajectory</h2>
      <div className="h-72">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#d9e1df" strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={48} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="yourPrice" name="Your Price" stroke="#2f7d59" strokeWidth={3} dot={false} />
              <Line
                type="monotone"
                dataKey="competitorPrice"
                name="Competitor Price"
                stroke="#db5c4c"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full bg-mist" />
        )}
      </div>
    </section>
  );
}
