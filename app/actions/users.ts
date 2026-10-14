"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { landingPath } from "@/lib/pages";
import {
  countAdmins,
  createManagedUser,
  deleteManagedUser,
  findUserById,
  isDuplicateEmail,
  updateManagedUser,
} from "@/lib/users";
import { validateAccount, type FormState } from "@/lib/validation";

function readAccount(formData: FormData, passwordRequired: boolean) {
  return validateAccount({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
    passwordRequired,
    accessType: String(formData.get("accessType") ?? ""),
    accessName: String(formData.get("accessName") ?? ""),
    pageIds: formData.getAll("pages").map(String),
    avatar: String(formData.get("avatar") ?? ""),
  });
}

export async function createUser(
  _state: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const account = readAccount(formData, true);
  if (account.errors) {
    return { errors: account.errors };
  }

  try {
    const passwordHash = await hash(account.password, 10);
    await createManagedUser({
      name: account.name,
      email: account.email,
      passwordHash,
      isAdmin: account.isAdmin,
      accessName: account.accessName,
      pageIds: account.pageIds,
      avatar: account.avatar,
    });
  } catch (error) {
    unstable_rethrow(error);
    if (isDuplicateEmail(error)) {
      return { message: "Já existe uma conta com esse e-mail." };
    }
    return { message: "Não foi possível criar o usuário agora." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/usuarios");
  return { saved: true };
}

export async function updateUser(
  userId: string,
  _state: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const actor = await requireAdmin();
  const current = await findUserById(userId);
  if (!current) {
    return { message: "Usuário não encontrado." };
  }

  const account = readAccount(formData, false);
  if (account.errors) {
    return { errors: account.errors };
  }

  if (current.isAdmin && !account.isAdmin && (await countAdmins()) <= 1) {
    return { message: "O painel precisa de pelo menos um administrador." };
  }

  try {
    const updated = await updateManagedUser({
      id: userId,
      name: account.name,
      email: account.email,
      passwordHash: account.password
        ? await hash(account.password, 10)
        : undefined,
      isAdmin: account.isAdmin,
      accessName: account.accessName,
      pageIds: account.pageIds,
      avatar: account.avatar,
    });

    if (!updated) {
      return { message: "Usuário não encontrado." };
    }
  } catch (error) {
    unstable_rethrow(error);
    if (isDuplicateEmail(error)) {
      return { message: "Já existe uma conta com esse e-mail." };
    }
    return { message: "Não foi possível salvar o usuário agora." };
  }

  if (actor.id === userId && !account.isAdmin) {
    redirect(landingPath({ isAdmin: false, pageIds: account.pageIds }));
  }

  revalidatePath("/", "layout");
  revalidatePath("/usuarios");
  return { saved: true };
}

export async function deleteUser(userId: string) {
  const actor = await requireAdmin();
  if (actor.id === userId) {
    redirect("/usuarios?aviso=proprio");
  }

  const current = await findUserById(userId);
  if (!current) {
    redirect("/usuarios");
  }

  if (current.isAdmin && (await countAdmins()) <= 1) {
    redirect("/usuarios?aviso=ultimo-admin");
  }

  await deleteManagedUser(userId);
  redirect("/usuarios");
}
