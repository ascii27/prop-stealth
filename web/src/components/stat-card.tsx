interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  variant?: "default" | "success" | "danger";
}

export function StatCard({
  label,
  value,
  detail,
  variant = "default",
}: StatCardProps) {
  const wrapperClass =
    variant === "danger"
      ? "bg-red-50 border border-red-200 rounded-lg p-4"
      : "bg-gray-50 border border-gray-200 rounded-lg p-4";

  const valueClass =
    variant === "success"
      ? "text-[22px] font-bold text-brand"
      : variant === "danger"
        ? "text-[22px] font-bold text-red-600"
        : "text-[22px] font-bold text-gray-900";

  const labelClass =
    variant === "danger"
      ? "text-[10px] uppercase tracking-wider text-red-800"
      : "text-[10px] uppercase tracking-wider text-gray-500";

  return (
    <div className={wrapperClass}>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value}</p>
      {detail && <p className="text-[10px] text-gray-500 mt-0.5">{detail}</p>}
    </div>
  );
}
