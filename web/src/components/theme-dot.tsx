import type { EmailTheme } from "@/lib/types";

interface ThemeDotProps {
  theme: EmailTheme;
}

const themeConfig: Record<EmailTheme, { dot: string; label: string }> = {
  tenant: { dot: "bg-blue-600", label: "TENANT" },
  hoa: { dot: "bg-purple-600", label: "HOA" },
  bill: { dot: "bg-brand", label: "BILL" },
  maintenance: { dot: "bg-amber-600", label: "MAINTENANCE" },
  other: { dot: "bg-gray-500", label: "OTHER" },
};

export function ThemeDot({ theme }: ThemeDotProps) {
  const { dot, label } = themeConfig[theme];

  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-sm ${dot}`} />
      <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
        {label}
      </span>
    </span>
  );
}
