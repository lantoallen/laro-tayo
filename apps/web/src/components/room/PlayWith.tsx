import { Segmented } from "@/components/game/Segmented";

/** Online, you can play friends you send a link to, or anyone else looking for the same game right now. */
export type PlayWith = "friends" | "anyone";

export function PlayWithField({ value, onChange }: { value: PlayWith; onChange: (value: PlayWith) => void }) {
  return (
    <Segmented<PlayWith>
      legend="Play with"
      name="with"
      value={value}
      onChange={onChange}
      options={[
        { value: "friends", label: "Friends" },
        { value: "anyone", label: "Anyone" },
      ]}
    />
  );
}
