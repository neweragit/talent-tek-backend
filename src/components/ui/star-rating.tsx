import { Star } from "lucide-react";
import { useMemo, useState } from "react";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  sizeClassName?: string;
  className?: string;
  ariaLabel?: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const StarRatingInput = ({
  value,
  onChange,
  disabled,
  sizeClassName = "h-6 w-6",
  className,
  ariaLabel = "Rating",
}: StarRatingInputProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const currentValue = useMemo(() => clamp(Number(value) || 0, 0, 5), [value]);
  const displayValue = hoverValue ?? currentValue;

  return (
    <div className={`inline-flex items-center gap-1 ${className ?? ""}`} role="radiogroup" aria-label={ariaLabel}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const starValue = idx + 1;
        const isFilled = starValue <= displayValue;

        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            className="rounded-md p-1 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            onMouseEnter={() => setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(null)}
            onFocus={() => setHoverValue(starValue)}
            onBlur={() => setHoverValue(null)}
            onClick={() => onChange(starValue)}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                onChange(clamp(currentValue + 1, 1, 5));
              }
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                onChange(clamp(currentValue - 1, 1, 5));
              }
              if (e.key === "Home") {
                e.preventDefault();
                onChange(1);
              }
              if (e.key === "End") {
                e.preventDefault();
                onChange(5);
              }
            }}
            role="radio"
            aria-checked={currentValue === starValue}
            aria-label={`Set rating to ${starValue} star${starValue === 1 ? "" : "s"}`}
          >
            <Star
              className={`${sizeClassName} ${isFilled ? "text-orange-600 fill-orange-600" : "text-orange-200"}`}
            />
          </button>
        );
      })}
    </div>
  );
};

