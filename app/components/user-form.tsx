"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteUser } from "@/app/actions/users";
import { AvatarMark } from "@/app/components/avatar-mark";
import { ConfirmSubmit } from "@/app/components/confirm-submit";
import { FormModal } from "@/app/components/form-modal";
import { avatars } from "@/lib/avatars";
import { assignablePages } from "@/lib/pages";
import type { FormState } from "@/lib/validation";

const fieldClass =
  "h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15";

const primaryButton =
  "inline-flex h-11 items-center rounded-lg bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-900";

export function UserForm({
  action,
  submitLabel,
  passwordRequired,
  defaults,
  title,
  description,
  triggerLabel,
  triggerClassName = primaryButton,
  userId,
  allowDelete = false,
}: {
  action: (
    state: FormState | undefined,
    formData: FormData,
  ) => Promise<FormState>;
  submitLabel: string;
  passwordRequired: boolean;
  defaults: {
    name: string;
    email: string;
    accessType: "admin" | "custom";
    accessName: string;
    pageIds: string[];
    avatar: string;
  };
  title: string;
  description?: string;
  triggerLabel: string;
  triggerClassName?: string;
  userId?: string;
  allowDelete?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>
      {open ? (
        <UserFormDialog
          action={action}
          submitLabel={submitLabel}
          passwordRequired={passwordRequired}
          defaults={defaults}
          title={title}
          description={description}
          userId={userId}
          allowDelete={allowDelete}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function UserFormDialog({
  action,
  submitLabel,
  passwordRequired,
  defaults,
  title,
  description,
  userId,
  allowDelete,
  onClose,
}: {
  action: (
    state: FormState | undefined,
    formData: FormData,
  ) => Promise<FormState>;
  submitLabel: string;
  passwordRequired: boolean;
  defaults: {
    name: string;
    email: string;
    accessType: "admin" | "custom";
    accessName: string;
    pageIds: string[];
    avatar: string;
  };
  title: string;
  description?: string;
  userId?: string;
  allowDelete: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [accessType, setAccessType] = useState(defaults.accessType);
  const [pageIds, setPageIds] = useState(defaults.pageIds);
  const [avatar, setAvatar] = useState(defaults.avatar);
  const pages = assignablePages();

  useEffect(() => {
    if (state?.saved) {
      onClose();
    }
  }, [state, onClose]);

  function togglePage(pageId: string) {
    setPageIds((current) =>
      current.includes(pageId)
        ? current.filter((id) => id !== pageId)
        : [...current, pageId],
    );
  }

  return (
    <FormModal title={title} description={description} pending={pending} onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col">
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-5 overflow-y-auto px-5 py-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Nome
              <input
                name="name"
                type="text"
                required
                autoFocus
                defaultValue={defaults.name}
                autoComplete="name"
                className={fieldClass}
              />
              {state?.errors?.name ? (
                <span className="font-normal text-red-600">{state.errors.name}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              E-mail
              <input
                name="email"
                type="email"
                required
                defaultValue={defaults.email}
                autoComplete="off"
                className={fieldClass}
              />
              {state?.errors?.email ? (
                <span className="font-normal text-red-600">{state.errors.email}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Senha
              <input
                name="password"
                type="password"
                required={passwordRequired}
                autoComplete="new-password"
                minLength={passwordRequired ? 8 : undefined}
                placeholder={passwordRequired ? "" : "Deixe em branco para manter"}
                className={fieldClass}
              />
              {state?.errors?.password ? (
                <span className="font-normal text-red-600">{state.errors.password}</span>
              ) : null}
            </label>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium">Ícone</legend>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {avatars.map((item) => (
                  <label
                    key={item.id}
                    className={
                      avatar === item.id
                        ? "flex cursor-pointer justify-center rounded-full ring-2 ring-teal-800 ring-offset-2"
                        : "flex cursor-pointer justify-center rounded-full"
                    }
                  >
                    <input
                      type="radio"
                      name="avatar"
                      value={item.id}
                      checked={avatar === item.id}
                      onChange={() => setAvatar(item.id)}
                      className="sr-only"
                      aria-label={item.label}
                    />
                    <AvatarMark id={item.id} />
                  </label>
                ))}
              </div>
              {state?.errors?.avatar ? (
                <span className="text-sm font-normal text-red-600">{state.errors.avatar}</span>
              ) : null}
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="text-sm font-medium">Nível de acesso</legend>
              <label className="flex items-start gap-3 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10">
                <input
                  type="radio"
                  name="accessType"
                  value="admin"
                  checked={accessType === "admin"}
                  onChange={() => setAccessType("admin")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Admin</span>
                  <span className="mt-1 block text-zinc-600 dark:text-zinc-400">
                    Vê todas as páginas, inclusive a de usuários.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10">
                <input
                  type="radio"
                  name="accessType"
                  value="custom"
                  checked={accessType === "custom"}
                  onChange={() => setAccessType("custom")}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Personalizado</span>
                  <span className="mt-1 block text-zinc-600 dark:text-zinc-400">
                    Você escolhe o nome do nível e as páginas que essa pessoa vê.
                  </span>
                </span>
              </label>
              {state?.errors?.accessType ? (
                <span className="text-sm text-red-600">{state.errors.accessType}</span>
              ) : null}
            </fieldset>

            {accessType === "custom" ? (
              <div className="flex flex-col gap-4 rounded-xl border border-dashed border-teal-800/30 p-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Nome do nível
                  <input
                    name="accessName"
                    type="text"
                    required
                    defaultValue={defaults.accessName}
                    placeholder="Ex.: Atendimento"
                    className={fieldClass}
                  />
                  {state?.errors?.accessName ? (
                    <span className="font-normal text-red-600">{state.errors.accessName}</span>
                  ) : null}
                </label>
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-sm font-medium">Páginas visíveis</legend>
                  {pages.map((page) => (
                    <label key={page.id} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        name="pages"
                        value={page.id}
                        checked={pageIds.includes(page.id)}
                        onChange={() => togglePage(page.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium">{page.title}</span>
                        <span className="mt-0.5 block text-zinc-600 dark:text-zinc-400">
                          {page.description}
                        </span>
                      </span>
                    </label>
                  ))}
                  {state?.errors?.pages ? (
                    <span className="text-sm text-red-600">{state.errors.pages}</span>
                  ) : null}
                </fieldset>
              </div>
            ) : null}

            {state?.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
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
              {pending ? "Salvando…" : submitLabel}
            </button>
          </div>
        </form>
        {allowDelete && userId ? (
          <div className="border-t border-black/10 px-5 py-4 dark:border-white/10">
            <ConfirmSubmit
              action={deleteUser.bind(null, userId)}
              label="Excluir usuário"
              confirm={`Excluir a conta de ${defaults.name}?`}
            />
          </div>
        ) : null}
      </div>
    </FormModal>
  );
}
