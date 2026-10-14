"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nome
        <input
          name="name"
          type="text"
          autoComplete="name"
          required
          className="h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15"
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
          autoComplete="email"
          required
          className="h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15"
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
          autoComplete="new-password"
          required
          minLength={8}
          className="h-11 rounded-lg border border-black/10 bg-transparent px-3 font-normal outline-none focus:border-teal-700 dark:border-white/15"
        />
        {state?.errors?.password ? (
          <span className="font-normal text-red-600">
            {state.errors.password}
          </span>
        ) : null}
      </label>
      {state?.message ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-11 rounded-lg bg-teal-800 text-sm font-medium text-white transition-colors hover:bg-teal-900 disabled:opacity-60"
      >
        {pending ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
