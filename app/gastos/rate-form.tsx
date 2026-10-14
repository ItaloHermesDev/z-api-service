"use client";

import { useActionState, useEffect, useState } from "react";
import { saveRatesAction } from "@/app/actions/spend";
import { FormModal } from "@/app/components/form-modal";
import { RATE_CATEGORIES, type RateCategory } from "@/lib/rates";

const fieldClass =
  "h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15";

export function RateForm({ rates }: { rates: Record<RateCategory, number> }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900"
      >
        Definir preços
      </button>
      {open ? <RateDialog rates={rates} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function RateDialog({
  rates,
  onClose,
}: {
  rates: Record<RateCategory, number>;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveRatesAction, undefined);

  useEffect(() => {
    if (state?.saved) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <FormModal
      title="Preço por envio"
      description="O gasto de cada template é o número de disparos vezes o preço da categoria."
      pending={pending}
      onClose={onClose}
    >
      <form action={action} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {RATE_CATEGORIES.map((category) => (
            <label key={category.id} className="flex flex-col gap-1.5 text-sm font-medium">
              {category.label}
              <input
                name={category.id}
                inputMode="decimal"
                defaultValue={(rates[category.id] / 100).toFixed(2).replace(".", ",")}
                className={fieldClass}
              />
            </label>
          ))}
          {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        </div>
        <div className="flex justify-end gap-3 border-t border-black/10 px-5 py-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="h-11 rounded-lg border border-black/10 px-4 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Salvar preços"}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
