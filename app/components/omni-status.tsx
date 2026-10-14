export function OmniStatus({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <p className="mt-3 text-sm text-teal-800 dark:text-teal-300">
        Secret Key encontrada no servidor. As chamadas já podem sair.
      </p>
    );
  }

  return (
    <p className="mt-3 max-w-xl rounded-xl border border-dashed border-teal-800/30 bg-teal-50 px-4 py-3 text-sm leading-6 text-zinc-700 dark:border-teal-300/30 dark:bg-teal-950/30 dark:text-zinc-300">
      A ferramenta já está pronta. Falta a Secret Key: coloque{" "}
      <code className="font-mono text-[0.9em]">OMNI_SECRET_KEY</code> no{" "}
      <code className="font-mono text-[0.9em]">.env.local</code> e reinicie o
      painel. A chave não aparece nesta tela.
    </p>
  );
}
