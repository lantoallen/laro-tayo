"use client";

/** A row of radio buttons that looks like a segmented control. */
export function Segmented<T extends string>(props: {
  legend: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">{props.legend}</legend>
      <div className="flex rounded-xl border-[3px] border-outline bg-surface p-1 shadow-[3px_3px_0_var(--outline)]">
        {props.options.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer rounded-md px-2 py-2 text-center text-sm font-medium text-muted has-checked:bg-blue has-checked:text-blue-ink has-focus-visible:outline-3 has-focus-visible:outline-blue"
          >
            <input
              type="radio"
              name={props.name}
              value={option.value}
              checked={props.value === option.value}
              onChange={() => props.onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
