"use client";

import { useActionState, useEffect, useState } from "react";
import { saveChannelAction } from "@/app/actions/channels";
import { FormModal } from "@/app/components/form-modal";
import { CHANNEL_TYPES } from "@/lib/channel-types";

const fieldClass =
  "h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15";

export function ChannelForm() {
  const [open, setOpen] = useState(false);
  const [savedName, setSavedName] = useState("");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900"
      >
        Registrar canal
      </button>
      {savedName ? (
        <p className="basis-full rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-950 dark:bg-teal-950/40 dark:text-teal-100">
          Canal {savedName} registrado. Conversas e Rotas já podem usá-lo.
        </p>
      ) : null}
      {open ? (
        <ChannelDialog
          onClose={() => setOpen(false)}
          onSaved={(name) => {
            setSavedName(name);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function ChannelDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [state, action, pending] = useActionState(saveChannelAction, undefined);
  const [name, setName] = useState("");

  useEffect(() => {
    if (state?.saved) {
      onSaved(name);
    }
  }, [state, onSaved, name]);

  return (
    <FormModal
      title="Registrar canal"
      description="A criação pela API exige o papel ENTERPRISE. Crie o canal no painel da Omni, copie o identificador e cole aqui. Registrar não conecta o número."
      pending={pending}
      onClose={onClose}
    >
      <form action={action} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nome
            <input
              name="name"
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Tipo
            <select name="type" required defaultValue="META_WHATSAPP" className={fieldClass}>
              {CHANNEL_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Identificador do canal
            <input name="channelId" required className={`${fieldClass} font-mono text-sm`} />
          </label>
          {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 px-5 py-4 dark:border-white/10">
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
            {pending ? "Salvando…" : "Registrar"}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
