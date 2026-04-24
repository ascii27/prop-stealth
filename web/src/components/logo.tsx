import Link from "next/link";

export function Logo({ size = "default" }: { size?: "small" | "default" }) {
  const iconSize = size === "small" ? "w-5 h-5" : "w-6 h-6";
  const textSize = size === "small" ? "text-xs" : "text-sm";

  return (
    <Link href="/" className="flex items-center gap-2">
      <div className={`${iconSize} bg-brand rounded-md`} />
      <span className={`font-semibold ${textSize} text-gray-900`}>
        PropStealth
      </span>
    </Link>
  );
}
