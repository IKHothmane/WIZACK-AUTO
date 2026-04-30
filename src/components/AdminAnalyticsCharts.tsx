import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

type SalesDatum = { name: string; val: number };
type CategoryDatum = { name: string; val: number };

export function AdminAnalyticsCharts({
  salesData,
  catData,
}: {
  salesData: SalesDatum[];
  catData: CategoryDatum[];
}) {
  const COLORS = ["#C9A84C", "#B8860B", "#8B6508", "#5E4A15"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="card-premium p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <p className="text-sm font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>
          Évolution des Ventes (7 derniers jours)
        </p>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "#C9A84C",
                }}
              />
              <Line
                type="monotone"
                dataKey="val"
                stroke="#C9A84C"
                strokeWidth={3}
                dot={{ fill: "#C9A84C", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-premium p-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <p className="text-sm font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>
          Répartition par Catégorie (%)
        </p>
        <div className="h-[250px] flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="val">
                {catData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "#C9A84C",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute right-6 flex flex-col gap-2">
            {catData.map((entry, index) => (
              <div key={`${entry.name}-legend`} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

