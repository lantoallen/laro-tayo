import { MAX_NAME_LENGTH } from "@laro/rooms";

/** The "Your name" box used before playing online. */
export function NameField({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold">Your name</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="nickname"
        required
        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5"
      />
    </label>
  );
}
