interface Props {
  label: string;
  value: number;
  tone?: 'neutral' | 'danger';
}

export function StatCard({ label, value, tone = 'neutral' }: Props) {
  const danger = tone === 'danger';

  return (
    <div
      className={`flex-1 rounded-card border p-3 ${
        danger ? 'border-danger-line bg-danger-soft' : 'border-line bg-surface'
      }`}
    >
      <p
        className={`text-2xl font-bold tabular-nums ${danger ? 'text-danger' : 'text-ink'}`}
      >
        {value}
      </p>
      <p className={`mt-0.5 text-xs ${danger ? 'text-danger' : 'text-muted'}`}>{label}</p>
    </div>
  );
}
