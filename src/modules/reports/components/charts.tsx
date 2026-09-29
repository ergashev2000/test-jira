import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const AXIS = { fill: '#9c9ca3', fontSize: 11 };
export const TOOLTIP_STYLE = {
  contentStyle: { background: '#1c1c1f', border: '1px solid #34343a', borderRadius: 8, fontSize: 12, color: '#ededef' },
  itemStyle: { color: '#ededef' },
  labelStyle: { color: '#9c9ca3' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

export interface Datum {
  name: string;
  value: number;
  color: string;
}

export const DonutChart = ({ data, height = 200, center }: { data: Datum[]; height?: number; center?: string }) => (
  <div className="relative" style={{ height }}>
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
          {data.filter((d) => d.value > 0).map((d) => <Cell key={d.name} fill={d.color} />)}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
    {center && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-semibold">{center}</div>}
  </div>
);

export const Legend = ({ data }: { data: Datum[] }) => (
  <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-xs">
    {data.map((d) => (
      <li key={d.name} className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
        <span className="flex-1 text-fg-2">{d.name}</span>
        <span className="tabular-nums text-fg">{d.value}</span>
      </li>
    ))}
  </ul>
);

export const HBarChart = ({ data, height }: { data: Datum[]; height?: number }) => (
  <div style={{ height: height ?? Math.max(120, data.length * 34) }}>
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#232326" />
        <XAxis type="number" allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={120} tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);
