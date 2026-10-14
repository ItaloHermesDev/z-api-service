import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/app/components/auth-frame";
import { SignupForm } from "@/app/cadastro/signup-form";
import { getOptionalUser } from "@/lib/auth";
import { landingPath } from "@/lib/pages";
import { countUsers } from "@/lib/users";

export default function SignupPage() {
  return (
    <AuthFrame
      title="Criar conta"
      subtitle="A primeira conta vira administrador e vê todas as páginas. As próximas são criadas por ele."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-teal-800 dark:text-teal-300">
            Entrar
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-zinc-500">Carregando…</p>}>
        <SignupGate />
      </Suspense>
    </AuthFrame>
  );
}

async function SignupGate() {
  if ((await countUsers()) > 0) {
    redirect("/login");
  }

  const user = await getOptionalUser();
  if (user) {
    redirect(landingPath(user));
  }

  return <SignupForm />;
}
