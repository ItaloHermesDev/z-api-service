"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { dispatchTemplateAction } from "@/app/actions/interactions";
import { ChannelField } from "@/app/components/channel-field";
import { FormModal } from "@/app/components/form-modal";
import { placeholders } from "@/lib/templates";

const fieldClass =
  "rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15";

export type DispatchTemplate = {
  name: string;
  language: string;
  body: string;
  category: string;
};

export function DispatchForm({
  configured,
  templates,
  channels,
}: {
  configured: boolean;
  templates: DispatchTemplate[];
  channels: Array<{ id: string; name: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const ready = configured && templates.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900"
      >
        Disparar template
      </button>
      {notice ? (
        <p className="basis-full rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-950 dark:bg-teal-950/40 dark:text-teal-100">
          {notice}
        </p>
      ) : null}
      {open ? (
        <DispatchDialog
          ready={ready}
          configured={configured}
          templates={templates}
          channels={channels}
          onClose={() => setOpen(false)}
          onSent={(message) => {
            setNotice(message);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function DispatchDialog({
  ready,
  configured,
  templates,
  channels,
  onClose,
  onSent,
}: {
  ready: boolean;
  configured: boolean;
  templates: DispatchTemplate[];
  channels: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSent: (notice: string) => void;
}) {
  const [state, action, pending] = useActionState(dispatchTemplateAction, undefined);
  const [selected, setSelected] = useState(templates[0] ? templateKey(templates[0]) : "");
  const seen = useRef(state);
  const current = templates.find((item) => templateKey(item) === selected) ?? templates[0];
  const names = placeholders(current?.body ?? "");

  useEffect(() => {
    if (state !== seen.current && state?.notice) {
      onSent(state.notice);
    }
    seen.current = state;
  }, [state, onSent]);

  return (
    <FormModal
      title="Disparar template"
      description="Só entra template já aprovado. O telefone leva DDI e DDD, sem máscara."
      pending={pending}
      onClose={onClose}
    >
      <form action={action} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <input type="hidden" name="body" value={current?.body ?? ""} />
          <input type="hidden" name="category" value={current?.category ?? "OUTROS"} />
          <ChannelField channels={channels} disabled={!ready} />
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Telefone
            <input
              name="phone"
              required
              inputMode="numeric"
              placeholder="5511999999999"
              disabled={!ready}
              className={`h-11 ${fieldClass}`}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Template
            <select
              name="template"
              required
              disabled={!ready}
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className={`h-11 ${fieldClass}`}
            >
              {templates.length === 0 ? (
                <option value="">Nenhum template aprovado</option>
              ) : (
                templates.map((template) => (
                  <option key={templateKey(template)} value={templateKey(template)}>
                    {template.name} · {template.language}
                  </option>
                ))
              )}
            </select>
          </label>
          {current?.body ? (
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{current.body}</p>
          ) : null}
          {names.map((name) => (
            <label key={name} className="flex flex-col gap-1.5 text-sm font-medium">
              Valor de {`{{${name}}}`}
              <input name={`example:${name}`} required disabled={!ready} className={`h-11 ${fieldClass}`} />
            </label>
          ))}
          {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 px-5 py-4 dark:border-white/10">
          {!ready ? (
            <p className="mr-auto text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {configured
                ? "É preciso um template aprovado nesta conta."
                : "O disparo libera quando a Secret Key estiver no servidor."}
            </p>
          ) : null}
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
            disabled={!ready || pending}
            className="h-11 rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {pending ? "Disparando…" : "Disparar"}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

function templateKey(template: DispatchTemplate) {
  return `${template.name}|${template.language}`;
}
