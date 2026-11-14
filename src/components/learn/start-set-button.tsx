"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { startWordSetAction } from "@/features/learning/actions/start-word-set.action";

export function StartSetButton({ slug, title, label }: { slug: string; title: string; label: string }) {
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
        setError(result.error === "not_signed_in" ? "Your session has ended. Please log in again." : "Could not start this set. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not start this set. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={start} aria-disabled={isStarting} aria-label={`${label}: ${title}`}>
        {isStarting ? "Adding..." : label}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-black">
          {error}
        </p>
      )}
    </div>
  );
}
