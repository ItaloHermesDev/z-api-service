import Link from "next/link";
import type { ReactNode } from "react";

export function AuthFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/login" className="mb-8 flex justify-center">
          <img src="/logo_nome.png" alt="Omini Z Service" width={2172} height={724} className="h-20 w-auto" />
        </Link>
        <section className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
          <div className="mt-8">{children}</div>
        </section>
        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {footer}
        </p>
      </div>
    </main>
  );
}
