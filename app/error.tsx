"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Não foi possível carregar esta página
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        A conexão com o banco pode ter falhado. Tente de novo em alguns
        instantes.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 h-11 w-fit rounded-lg bg-teal-800 px-4 text-sm font-medium text-white"
      >
        Tentar de novo
      </button>
    </main>
  );
}
