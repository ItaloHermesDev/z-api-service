"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function FormModal({
  title,
  description,
  pending = false,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  pending?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  const titleId = "form-modal-title";

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!pending) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90vh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white text-left text-zinc-950 shadow-xl dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div>
            <h2 id={titleId} className="text-lg font-medium">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Fechar"
            className="h-9 rounded-lg px-3 text-sm hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
