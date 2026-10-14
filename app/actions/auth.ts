"use server";

import { compare, hash } from "bcryptjs";
import { redirect, unstable_rethrow } from "next/navigation";
import { landingPath } from "@/lib/pages";
import { getSession } from "@/lib/session";
import {
  createFirstAdmin,
  findUserByEmail,
  isDuplicateEmail,
} from "@/lib/users";
import {
  validateLogin,
  validateSignup,
  type FormState,
} from "@/lib/validation";

export async function login(
  _state: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const errors = validateLogin({ email, password });

  if (errors) {
    return { errors };
  }

  try {
    const user = await findUserByEmail(email);
    const valid = user ? await compare(password, user.passwordHash) : false;

    if (!user || !valid) {
      return { message: "E-mail ou senha incorretos." };
    }

    const session = await getSession();
    session.userId = user.id;
    await session.save();
    redirect(landingPath(user));
  } catch (error) {
    unstable_rethrow(error);
    return { message: "Não foi possível entrar agora. Tente de novo." };
  }
}

export async function signup(
  _state: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const errors = validateSignup({ name, email, password });

  if (errors) {
    return { errors };
  }

  try {
    const passwordHash = await hash(password, 10);
    const user = await createFirstAdmin({ name, email, passwordHash });
    if ("error" in user) {
      return {
        message: "O primeiro acesso já foi criado. Entre com essa conta.",
      };
    }

    const session = await getSession();
    session.userId = user.id;
    await session.save();
  } catch (error) {
    unstable_rethrow(error);
    if (isDuplicateEmail(error)) {
      return { message: "Já existe uma conta com esse e-mail." };
    }

    return { message: "Não foi possível criar a conta agora. Tente de novo." };
  }

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
