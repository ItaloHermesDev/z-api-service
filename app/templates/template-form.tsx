"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTemplateAction } from "@/app/actions/templates";
import { FormModal } from "@/app/components/form-modal";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_LANGUAGES,
  placeholders,
} from "@/lib/templates";

const fieldClass =
  "rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15";

export function TemplateForm({
  configured,
  wabaId,
}: {
  configured: boolean;
  wabaId: string;
}) {
  const [state, action, pending] = useActionState(createTemplateAction, undefined);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const seenState = useRef(state);
  const ready = configured && Boolean(wabaId);
  const names = placeholders(body);

  useEffect(() => {
    if (state !== seenState.current && state?.notice) {
      setOpen(false);
    }
    seenState.current = state;
  }, [state]);

  function openModal() {
    setBody("");
    setOpen(true);
  }

  function closeModal() {
    if (pending) {
      return;
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex h-11 items-center rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900"
      >
        Novo template
      </button>
      {state?.notice ? (
        <p className="basis-full rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-950 dark:bg-teal-950/40 dark:text-teal-100">
          {state.notice}
        </p>
      ) : null}
      {open ? (
        <FormModal
          title="Novo template"
          description="A Meta recebe como em análise. A lista mostra se ficou aprovado ou recusado."
          pending={pending}
          onClose={closeModal}
        >
            <form action={action} className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
                <input type="hidden" name="wabaId" value={wabaId} />
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Nome
                  <input
                    name="name"
                    required
                    autoFocus
                    placeholder="confirmacao_pedido"
                    className={`h-11 ${fieldClass}`}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Categoria
                    <select
                      name="category"
                      required
                      defaultValue="UTILITY"
                      className={`h-11 ${fieldClass}`}
                    >
                      {TEMPLATE_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Idioma
                    <select
                      name="language"
                      required
                      defaultValue="pt_BR"
                      className={`h-11 ${fieldClass}`}
                    >
                      {TEMPLATE_LANGUAGES.map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Texto
                  <textarea
                    name="body"
                    required
                    rows={5}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Olá {{cliente}}, seu pedido {{pedido}} foi confirmado."
                    className={`py-2 ${fieldClass}`}
                  />
                </label>
                {names.map((name) => (
                  <label key={name} className="flex flex-col gap-1.5 text-sm font-medium">
                    Exemplo de {`{{${name}}}`}
                    <input name={`example:${name}`} required className={`h-11 ${fieldClass}`} />
                  </label>
                ))}
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Rodapé
                  <input
                    name="footer"
                    placeholder="Opcional, sem variável"
                    className={`h-11 ${fieldClass}`}
                  />
                </label>
                {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 px-5 py-4 dark:border-white/10">
                {!ready ? (
                  <p className="mr-auto text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    O envio libera quando a Secret Key e a conta oficial estiverem ligadas.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={pending}
                  className="h-11 rounded-lg border border-black/10 px-4 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!ready || pending}
                  className="h-11 rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
                >
                  {pending ? "Enviando…" : "Criar template"}
                </button>
              </div>
            </form>
        </FormModal>
      ) : null}
    </>
  );
}
