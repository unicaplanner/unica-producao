const TONE_STYLES = {
  vinho: "bg-vinho-bg border-vinho-border text-vinho",
  ocre: "bg-ocre-bg border-ocre-border text-ocre",
  oliva: "bg-oliva-bg border-oliva-border text-oliva",
  neutro: "bg-header-bg border-border text-muted",
};

export function StatCard({
  label,
  value,
  tone = "neutro",
}: {
  label: string;
  value: number;
  tone?: keyof typeof TONE_STYLES;
}) {
  return (
    <div className={`flex-1 rounded-[10px] border p-3 ${TONE_STYLES[tone]}`}>
      <p className="text-[11px] font-bold">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
