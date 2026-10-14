import { isAvatarId } from "@/lib/avatars";
import { assignablePages } from "@/lib/pages";

export type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  accessType?: string;
  accessName?: string;
  pages?: string;
  avatar?: string;
};

export type FormState = {
  errors?: FieldErrors;
  message?: string;
  saved?: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(input: {
  name: string;
  email: string;
  password: string;
}) {
  const errors: FieldErrors = {};

  if (input.name.trim().length < 2) {
    errors.name = "Informe um nome com pelo menos 2 caracteres.";
  } else if (input.name.trim().length > 120) {
    errors.name = "O nome pode ter no máximo 120 caracteres.";
  }

  if (!emailPattern.test(input.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (input.password.length < 8) {
    errors.password = "A senha precisa ter pelo menos 8 caracteres.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateLogin(input: { email: string; password: string }) {
  const errors: FieldErrors = {};

  if (!emailPattern.test(input.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!input.password) {
    errors.password = "Informe a senha.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateAccount(input: {
  name: string;
  email: string;
  password: string;
  passwordRequired: boolean;
  accessType: string;
  accessName: string;
  pageIds: string[];
  avatar: string;
}) {
  const errors: FieldErrors = {};
  const allowed = new Set(assignablePages().map((page) => page.id));
  const pageIds = [...new Set(input.pageIds.filter((pageId) => allowed.has(pageId)))];

  if (input.name.trim().length < 2) {
    errors.name = "Informe um nome com pelo menos 2 caracteres.";
  } else if (input.name.trim().length > 120) {
    errors.name = "O nome pode ter no máximo 120 caracteres.";
  }

  if (!emailPattern.test(input.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (input.passwordRequired && input.password.length < 8) {
    errors.password = "A senha precisa ter pelo menos 8 caracteres.";
  } else if (input.password && input.password.length < 8) {
    errors.password = "A senha precisa ter pelo menos 8 caracteres.";
  }

  if (input.accessType !== "admin" && input.accessType !== "custom") {
    errors.accessType = "Escolha um nível de acesso.";
  }

  if (!isAvatarId(input.avatar)) {
    errors.avatar = "Escolha um ícone.";
  }

  if (input.accessType === "custom") {
    const accessName = input.accessName.trim();
    if (accessName.length < 2) {
      errors.accessName = "Dê um nome para esse nível.";
    } else if (accessName.length > 80) {
      errors.accessName = "O nome pode ter no máximo 80 caracteres.";
    } else if (accessName.toLocaleLowerCase("pt-BR") === "admin") {
      errors.accessName = "Esse nome fica reservado para o administrador.";
    }

    if (pageIds.length === 0) {
      errors.pages = "Escolha pelo menos uma página.";
    }
  }

  return {
    errors: Object.keys(errors).length > 0 ? errors : null,
    pageIds,
    isAdmin: input.accessType === "admin",
    accessName: input.accessName.trim(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    avatar: isAvatarId(input.avatar) ? input.avatar : "1",
  };
}
