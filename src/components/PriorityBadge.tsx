import { PRIORITY_LABEL, PRIORITY_TONE, type Priority } from "@/lib/priority";

const TONE_STYLES = {
  vinho: "bg-vinho-bg text-vinho ring-vinho-border",
  ocre: "bg-ocre-bg text-ocre ring-ocre-border",
  oliva: "bg-oliva-bg text-oliva ring-oliva-border",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_STYLES[PRIORITY_TONE[priority]]}`}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
