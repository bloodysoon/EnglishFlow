"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { startWordSetAction } from "@/features/learning/actions/start-word-set.action";

export function StartSetButton({
  slug,
  title,
  label,
  texts,
}: {
  slug: string;
  title: string;
  label: string;
  texts: { adding: string; failed: string; sessionEnded: string };
}) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      const result = await startWordSetAction({ slug });
      if (!result.success) {
        setError(result.error === "not_signed_in" ? texts.sessionEnded : texts.failed);
        return;
      }
      router.refresh();
    } catch {
      setError(texts.failed);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={start} aria-disabled={isStarting} aria-label={`${label}: ${title}`}>
        {isStarting ? texts.adding : label}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-black">
          {error}
        </p>
      )}
    </div>
  );
}
