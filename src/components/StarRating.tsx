import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const Icon = (
          <Star
            className={cn(px, filled ? "fill-accent text-accent" : "text-muted-foreground")}
            strokeWidth={1.5}
          />
        );
        if (!onChange) return <span key={star}>{Icon}</span>;
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange(value === star ? 0 : star)}
            className="rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring/40"
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}

export function RatingSummary({ average, count }: { average: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <StarRating value={Math.round(average)} size="sm" />
      <span className="text-xs text-muted-foreground">
        {count ? `${average.toFixed(1)} · ${count} rating${count > 1 ? "s" : ""}` : "No ratings yet"}
      </span>
    </div>
  );
}
