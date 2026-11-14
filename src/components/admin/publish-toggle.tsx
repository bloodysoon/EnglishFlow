"use client";

import { useState } from "react";

import { ADMIN_ERRORS } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";
import { publishWordSetAction } from "@/features/admin/actions/publish-word-set.action";

export function PublishToggle({ setId, title, published: initial }: { setId: string; title: string; published: boolean }) {
  const [published, setPublished] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (isSaving) return;
    const next = !published;
    setIsSaving(true);
    setError(null);
    try {
      const result = await publishWordSetAction({ setId, published: next });
      if (result.success) setPublished(next);
      else setError(ADMIN_ERRORS[result.error]);
    } catch {
      setError(ADMIN_ERRORS.unexpected);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant={published ? "secondary" : "primary"}
        size="sm"
        onClick={toggle}
        aria-disabled={isSaving}
        aria-label={`${published ? "Unpublish" : "Publish"} ${title}`}
      >
        {isSaving ? "Saving..." : published ? "Unpublish" : "Publish"}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-black">
          {error}
        </p>
      )}
    </div>
  );
}
