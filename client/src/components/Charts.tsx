import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NamedCount, Point } from "../api";

const COLORS = ["#3dffb0", "#5b8cff", "#ff8a4c", "#c084fc", "#f472b6", "#facc15", "#22d3ee"];

const tooltipStyle = {
  background: "#12161c",
  border: "1px solid #232a33",
  borderRadius: 12,
  fontSize: 12,
};

export function ClicksChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="clicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3dffb0" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3dffb0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#232a33" vertical={false} />
          <XAxis
            dataKey="t"
            tick={{ fill: "#8b98a5", fontSize: 11 }}
            tickFormatter={(v: string) => (v.includes("T") ? v.slice(11, 16) : v.slice(5))}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: "#8b98a5", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#b4c0cc" }} />
          <Area type="monotone" dataKey="clicks" stroke="#3dffb0" strokeWidth={2} fill="url(#clicks)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RankedBars({ data, color = "#5b8cff" }: { data: NamedCount[]; color?: string }) {
  const rows = data.slice(0, 8);
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#232a33" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fill: "#b4c0cc", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data }: { data: NamedCount[] }) {
  return (
    <div className="flex h-64 items-center">
      <ResponsiveContainer width="55%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={48} outerRadius={74} paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-mist-300">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span>{d.name}</span>
            <span className="font-mono text-mist-100">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
