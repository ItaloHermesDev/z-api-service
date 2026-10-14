import { Suspense } from "react";
import { deleteChannelAction } from "@/app/actions/channels";
import { ChannelForm } from "@/app/canais/channel-form";
import { ConfirmSubmit } from "@/app/components/confirm-submit";
import { OmniStatus } from "@/app/components/omni-status";
import { requirePage } from "@/lib/auth";
import { CHANNEL_TYPES } from "@/lib/channel-types";
import { listChannels } from "@/lib/channels";
import { omniConfigured } from "@/lib/omni";

export default function CanaisPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando…</p>}>
      <CanaisScreen />
    </Suspense>
  );
}

async function CanaisScreen() {
  await requirePage("canais");
  const [configured, channels] = await Promise.all([omniConfigured(), listChannels()]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Canais</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Esta conta não cria canal pela API: a Omni exige o papel ENTERPRISE.
            Crie o canal no painel da Omni e registre o identificador aqui.
          </p>
        </div>
        <ChannelForm />
      </div>
      <OmniStatus configured={configured} />
      {channels.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">Nenhum canal registrado.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {channels.map((channel) => (
            <li
              key={channel.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-black/10 px-4 py-4 dark:border-white/10"
            >
              <div>
                <p className="font-medium">{channel.name}</p>
                <p className="mt-1 text-sm text-teal-800 dark:text-teal-300">
                  {CHANNEL_TYPES.find((type) => type.id === channel.type)?.label ?? channel.type}
                </p>
                <p className="mt-2 break-all font-mono text-xs text-zinc-500">{channel.id}</p>
              </div>
              <ConfirmSubmit
                action={deleteChannelAction.bind(null, channel.id)}
                label="Remover"
                confirm={`Remover o canal ${channel.name} desta lista?`}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
