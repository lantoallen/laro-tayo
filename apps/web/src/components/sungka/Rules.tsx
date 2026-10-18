"use client";

import { useRef } from "react";

export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>
          Bawat player ay may 7 bahay (yung maliliit na butas) at isang ulo (yung malaki sa kaliwa mo). Tig-7 na sigay
          ang bawat bahay sa simula.
        </li>
        <li>
          Kunin lahat ng sigay sa isa sa mga bahay mo, tapos ihulog isa-isa pa-clockwise. Hulugan mo rin ang ulo mo
          pagdaan, pero laktawan ang ulo ng kalaban.
        </li>
        <li>Kapag sa ulo mo bumagsak ang huling sigay, tira ka ulit.</li>
        <li>Kapag sa bahay na may laman bumagsak, kunin lahat ng laman nito at ituloy ang paghulog.</li>
        <li>
          Kapag sa bakanteng bahay mo bumagsak, kunin mo yon pati lahat ng sigay sa katapat na bahay, at ilagay sa ulo
          mo.
        </li>
        <li>Kapag sa bakanteng bahay ng kalaban bumagsak, tapos na ang tira mo.</li>
        <li>
          Kung wala nang sigay sa side mo, laktaw ka muna. Tapos ang laro kapag nasa mga ulo na lahat ng sigay, at
          panalo ang may pinakamarami.
        </li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Sa tradisyonal na laro, sabay ang unang tira ng dalawang player. Dito, salitan na agad mula umpisa.
      </p>
    </>
  );
}

export function RulesButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label="Paano laruin"
        className="size-9 rounded-lg border border-line font-semibold"
      >
        ?
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="rules-title"
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border border-line bg-surface p-5 text-ink backdrop:bg-black/50"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <h2 id="rules-title" className="mb-3 text-lg font-bold">
          Paano laruin
        </h2>
        <Rules />
        <form method="dialog" className="mt-5">
          <button className="w-full rounded-lg bg-blue py-2.5 font-semibold text-blue-ink">Sige</button>
        </form>
      </dialog>
    </>
  );
}
