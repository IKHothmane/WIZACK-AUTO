import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SalesDatum = { name: string; ventes: number };

export function AdminSalesChart({ salesData }: { salesData: SalesDatum[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={salesData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="var(--color-text-secondary)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--color-text-primary)",
            }}
            itemStyle={{ color: "#C9A84C", fontWeight: "bold" }}
          />
          <Line
            type="monotone"
            dataKey="ventes"
            stroke="#C9A84C"
            strokeWidth={3}
            dot={{ r: 4, fill: "#C9A84C", strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

