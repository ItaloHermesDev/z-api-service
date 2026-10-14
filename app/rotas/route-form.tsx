"use client";

import { useActionState, useEffect, useState } from "react";
import { createRouteAction } from "@/app/actions/routes";
import { ChannelField } from "@/app/components/channel-field";
import { FormModal } from "@/app/components/form-modal";
import { RATE_CATEGORIES } from "@/lib/rates";
import { TEMPLATE_LANGUAGES } from "@/lib/templates";

const fieldClass =
  "h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15";

export type RouteTemplate = {
  name: string;
  language: string;
  body: string;
  category: string;
};

export function RouteForm({
  templates,
  channels,
}: {
  templates: RouteTemplate[];
  channels: Array<{ id: string; name: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900"
      >
        Nova rota
      </button>
      {notice ? (
        <p className="basis-full rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-950 dark:bg-teal-950/40 dark:text-teal-100">
          {notice}
        </p>
      ) : null}
      {open ? (
        <RouteDialog
          templates={templates}
          channels={channels}
          onClose={() => setOpen(false)}
          onSaved={(message) => {
            setNotice(message);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function RouteDialog({
  templates,
  channels,
  onClose,
  onSaved,
}: {
  templates: RouteTemplate[];
  channels: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: (notice: string) => void;
}) {
  const [state, action, pending] = useActionState(createRouteAction, undefined);
  const [kind, setKind] = useState("receber");
  const [selected, setSelected] = useState(templates[0] ? templateKey(templates[0]) : "");
  const current = templates.find((item) => templateKey(item) === selected);

  useEffect(() => {
    if (state?.saved && state.notice) {
      onSaved(state.notice);
    }
  }, [state, onSaved]);

  return (
    <FormModal
      title="Nova rota"
      description="Receber guarda as mensagens que chegarem. Disparar envia um template quando alguém chamar o endereço."
      pending={pending}
      onClose={onClose}
    >
      <form action={action} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          {kind === "disparar" && current ? (
            <>
              <input type="hidden" name="body" value={current.body} />
              <input type="hidden" name="category" value={current.category || "OUTROS"} />
            </>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nome
            <input name="name" required autoFocus className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Tipo
            <select
              name="kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className={fieldClass}
            >
              <option value="receber">Receber mensagens</option>
              <option value="disparar">Disparar template</option>
            </select>
          </label>
          <ChannelField channels={channels} required={kind === "disparar"} />
          {kind === "disparar" && templates.length > 0 ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Template
              <select
                name="template"
                required
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                className={fieldClass}
              >
                {templates.map((template) => (
                  <option key={templateKey(template)} value={templateKey(template)}>
                    {template.name} · {template.language}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {kind === "disparar" && templates.length === 0 ? (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Nome do template
                <input name="templateName" required placeholder="confirmacao_pedido" className={fieldClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Idioma
                <select name="language" defaultValue="pt_BR" className={fieldClass}>
                  {TEMPLATE_LANGUAGES.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Categoria
                <select name="category" defaultValue="UTILITY" className={fieldClass}>
                  {RATE_CATEGORIES.filter((item) => item.id !== "OUTROS").map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
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
            {pending ? "Criando…" : "Criar rota"}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

function templateKey(template: RouteTemplate) {
  return `${template.name}|${template.language}`;
}
