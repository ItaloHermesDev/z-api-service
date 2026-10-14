import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { landingPath, visiblePages } from "@/lib/pages";

export default function NoAccessPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando…</p>}>
      <NoAccess />
    </Suspense>
  );
}

async function NoAccess() {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }
  if (visiblePages(user).length > 0) {
    redirect(landingPath(user));
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Sem páginas liberadas</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Sua conta não tem nenhuma página marcada. Peça a um administrador para
        escolher o que você pode ver.
      </p>
    </>
  );
}
