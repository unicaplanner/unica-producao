import { PRIORITY_LABEL, type Priority } from "@/lib/priority";

const STYLES: Record<Priority, string> = {
  atrasado: "bg-red-100 text-red-800 ring-red-600/20",
  sai_hoje: "bg-orange-100 text-orange-800 ring-orange-600/20",
  sai_amanha: "bg-amber-100 text-amber-800 ring-amber-600/20",
  no_prazo: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[priority]}`}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
