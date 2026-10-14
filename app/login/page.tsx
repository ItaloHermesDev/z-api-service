import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/app/components/auth-frame";
import { LoginForm } from "@/app/login/login-form";
import { getOptionalUser } from "@/lib/auth";
import { landingPath } from "@/lib/pages";
import { countUsers } from "@/lib/users";

export default function LoginPage() {
  return (
    <AuthFrame
      title="Entrar"
      subtitle="Acesso ao Omini Z Service. A conta da Omni Z-API entra depois, quando você tiver as credenciais."
      footer={
        <Suspense fallback={null}>
          <SignupOffer />
        </Suspense>
      }
    >
      <Suspense fallback={<p className="text-sm text-zinc-500">Carregando…</p>}>
        <LoginGate />
      </Suspense>
    </AuthFrame>
  );
}

async function SignupOffer() {
  if ((await countUsers()) > 0) {
    return null;
  }

  return (
    <>
      Ainda não tem conta?{" "}
      <Link href="/cadastro" className="font-medium text-teal-800 dark:text-teal-300">
        Criar o administrador
      </Link>
    </>
  );
}

async function LoginGate() {
  const user = await getOptionalUser();
  if (user) {
    redirect(landingPath(user));
  }

  return <LoginForm />;
}
