import { Suspense } from "react";
import { createUser, updateUser } from "@/app/actions/users";
import { AvatarMark } from "@/app/components/avatar-mark";
import { UserForm } from "@/app/components/user-form";
import { requireAdmin } from "@/lib/auth";
import { pageById } from "@/lib/pages";
import { listUsers } from "@/lib/users";

const warnings: Record<string, string> = {
  proprio: "Você não pode excluir a própria conta.",
  "ultimo-admin": "O painel precisa de pelo menos um administrador.",
};

export default function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-zinc-500">Carregando usuários…</p>}>
      <UsersScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function UsersScreen({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const user = await requireAdmin();
  const [{ aviso }, users] = await Promise.all([searchParams, listUsers()]);
  const warning = aviso ? warnings[aviso] : undefined;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Usuários</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Admin vê tudo. No nível personalizado, o nome é seu e as páginas
            marcadas são as únicas que a pessoa vê.
          </p>
        </div>
        <UserForm
          action={createUser}
          submitLabel="Criar usuário"
          passwordRequired
          title="Novo usuário"
          description="Admin vê tudo. No personalizado, você escolhe o nome e as páginas."
          triggerLabel="Novo usuário"
          defaults={{
            name: "",
            email: "",
            accessType: "custom",
            accessName: "",
            pageIds: [],
            avatar: "1",
          }}
        />
      </div>
      {warning ? (
        <p className="mt-6 rounded-lg border border-red-600/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {warning}
        </p>
      ) : null}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="py-2 pr-4 font-medium">Nome</th>
              <th className="py-2 pr-4 font-medium">E-mail</th>
              <th className="py-2 pr-4 font-medium">Nível</th>
              <th className="py-2 pr-4 font-medium">Páginas</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id} className="border-t border-black/10 dark:border-white/10">
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-3">
                    <AvatarMark id={item.avatar} />
                    <span>
                      {item.name}
                      {item.id === user.id ? (
                        <span className="ml-2 text-xs text-zinc-500">você</span>
                      ) : null}
                    </span>
                  </span>
                </td>
                <td className="py-3 pr-4">{item.email}</td>
                <td className="py-3 pr-4">{item.accessName}</td>
                <td className="py-3 pr-4">
                  {item.isAdmin
                    ? "Todas"
                    : item.pageIds
                        .map((pageId) => pageById(pageId)?.title ?? pageId)
                        .join(", ")}
                </td>
                <td className="py-3 text-right">
                  <UserForm
                    action={updateUser.bind(null, item.id)}
                    submitLabel="Salvar"
                    passwordRequired={false}
                    title="Editar usuário"
                    description={item.email}
                    triggerLabel="Editar"
                    triggerClassName="font-medium text-teal-800 dark:text-teal-300"
                    userId={item.id}
                    allowDelete={item.id !== user.id}
                    defaults={{
                      name: item.name,
                      email: item.email,
                      accessType: item.isAdmin ? "admin" : "custom",
                      accessName: item.isAdmin ? "" : item.accessName,
                      pageIds: item.pageIds,
                      avatar: item.avatar,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
