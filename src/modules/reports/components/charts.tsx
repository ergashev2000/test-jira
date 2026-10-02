import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const AXIS = { fill: 'var(--c-fg-2)', fontSize: 11 };
export const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--c-surface-2)', border: '1px solid var(--c-line-strong)', borderRadius: 8, fontSize: 12, color: 'var(--c-fg)' },
  itemStyle: { color: 'var(--c-fg)' },
  labelStyle: { color: 'var(--c-fg-2)' },
  cursor: { fill: 'var(--c-surface-2)' },
};

export interface Datum {
  name: string;
  value: number;
  color: string;
}

/** Rounded segments with small gaps; a lone segment is drawn as a full ring without a gap. */
export const DonutChart = ({ data, height = 200, center }: { data: Datum[]; height?: number; center?: string }) => {
  const visible = data.filter((d) => d.value > 0);
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={visible} dataKey="value" nameKey="name" innerRadius="74%" outerRadius="92%"
            startAngle={90} endAngle={-270} paddingAngle={visible.length > 1 ? 3 : 0} cornerRadius={4} stroke="none">
            {visible.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
      {center && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-semibold">{center}</div>}
    </div>
  );
};

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
        <CartesianGrid horizontal={false} stroke="var(--c-line)" />
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
