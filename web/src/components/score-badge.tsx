interface ScoreBadgeProps {
  score: number;
  size?: "small" | "large";
}

export function ScoreBadge({ score, size = "large" }: ScoreBadgeProps) {
  let colorClass: string;
  if (score >= 80) {
    colorClass = "text-brand border-brand bg-brand-light";
  } else if (score >= 60) {
    colorClass = "text-amber-600 border-amber-400 bg-amber-50";
  } else {
    colorClass = "text-red-600 border-red-400 bg-red-50";
  }

  const sizeClass =
    size === "large"
      ? "text-3xl font-extrabold border-2 rounded-xl px-5 py-3"
      : "text-lg font-extrabold border-2 rounded-lg px-3 py-1.5";

  return (
    <span className={`inline-block ${sizeClass} ${colorClass}`}>
      {score} / 100
    </span>
  );
}
