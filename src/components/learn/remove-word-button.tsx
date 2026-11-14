"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { removeMyWordAction } from "@/features/learning/actions/word-list.actions";

// Two steps (Remove → Yes, remove) so a stray tap never deletes a word.
export function RemoveWordButton({ wordId, lemma, custom }: { wordId: string; lemma: string; custom: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(false);

  const link =
    "min-h-11 cursor-pointer px-1 text-sm font-black underline decoration-[3px] underline-offset-4 hover:decoration-mark";

  async function remove() {
    if (isRemoving) return;
    setIsRemoving(true);
    setError(false);
    try {
      const result = await removeMyWordAction({ wordId });
      if (result.success) router.refresh();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setIsRemoving(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <div className="flex flex-col items-end">
        <button type="button" onClick={() => setConfirming(true)} className={link} aria-label={`Remove ${lemma}`}>
          Remove
        </button>
        {error && (
          <p role="alert" className="text-xs font-black">
            Not removed. Try again.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-xs font-semibold text-muted">{custom ? "Deletes your word." : "Progress is lost."}</span>
      <button
        type="button"
        onClick={remove}
        aria-disabled={isRemoving}
        className="min-h-11 cursor-pointer border-[2px] border-line bg-box-1 px-3 text-sm font-black text-on-box"
      >
        {isRemoving ? "Removing..." : "Yes, remove"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className={link}>
        Cancel
      </button>
    </div>
  );
}
