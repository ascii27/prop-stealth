import { ReactNode } from "react";

type StatusVariant =
  | "occupied"
  | "vacant"
  | "proposed"
  | "evaluating"
  | "approved"
  | "all-occupied";

interface StatusBadgeProps {
  variant: StatusVariant;
  children: ReactNode;
}

const variantClasses: Record<StatusVariant, string> = {
  occupied: "text-brand bg-brand-light",
  vacant: "text-red-600 bg-red-50",
  proposed: "text-amber-600 bg-amber-50",
  evaluating: "text-gray-500 bg-gray-100",
  approved: "text-brand bg-brand-light",
  "all-occupied": "text-brand bg-brand-light",
};

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
