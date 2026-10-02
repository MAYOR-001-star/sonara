"use client";

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  small = false,
  label = "Quantity",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  small?: boolean;
  label?: string;
}) {
  const btn = small
    ? "h-8 w-8 text-base"
    : "h-11 w-11 text-lg";

  return (
    <div
      className="inline-flex items-center rounded-full bg-mist"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={`${btn} cursor-pointer rounded-l-full text-ink/60 transition-colors hover:text-peach disabled:cursor-not-allowed disabled:opacity-30`}
      >
        &minus;
      </button>

      <span
        aria-live="polite"
        className={`${small ? "w-7 text-sm" : "w-10 text-base"} text-center font-bold`}
      >
        {value}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={`${btn} cursor-pointer rounded-r-full text-ink/60 transition-colors hover:text-peach disabled:cursor-not-allowed disabled:opacity-30`}
      >
        +
      </button>
    </div>
  );
}
