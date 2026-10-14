export const TEMPLATE_CATEGORIES = [
  { id: "UTILITY", label: "Utilidade" },
  { id: "MARKETING", label: "Marketing" },
] as const;

export const TEMPLATE_LANGUAGES = [
  { id: "pt_BR", label: "Português (Brasil)" },
  { id: "pt_PT", label: "Português (Portugal)" },
  { id: "en_US", label: "Inglês" },
  { id: "es", label: "Espanhol" },
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]["id"];
export type TemplateLanguage = (typeof TEMPLATE_LANGUAGES)[number]["id"];

const placeholderPattern = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export function placeholders(text: string) {
  const found: string[] = [];
  for (const match of text.matchAll(placeholderPattern)) {
    const name = match[1];
    if (name && !found.includes(name)) {
      found.push(name);
    }
  }
  return found;
}

export function statusLabel(status: string) {
  if (status === "APPROVED") return "Aprovado";
  if (status === "REJECTED") return "Recusado";
  if (status === "PENDING") return "Em análise";
  return status;
}

export function categoryLabel(category: string) {
  return TEMPLATE_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

export function languageLabel(language: string) {
  return TEMPLATE_LANGUAGES.find((item) => item.id === language)?.label ?? language;
}

export function buildTemplatePayload(input: {
  name: string;
  category: string;
  language: string;
  body: string;
  footer: string;
  examples: Record<string, string>;
}) {
  const name = input.name.trim();
  const body = input.body.trim();
  const footer = input.footer.trim();
  const category = TEMPLATE_CATEGORIES.find((item) => item.id === input.category)?.id;
  const language = TEMPLATE_LANGUAGES.find((item) => item.id === input.language)?.id;

  if (!/^[a-z0-9_]+$/.test(name)) {
    return {
      error: "O nome usa só letras minúsculas, números e sublinhado, sem espaço.",
    };
  }
  if (!category) {
    return { error: "Escolha a categoria." };
  }
  if (!language) {
    return { error: "Escolha o idioma." };
  }
  if (!body) {
    return { error: "Escreva o texto do template." };
  }
  if (body.length > 1024) {
    return { error: "O texto passa de 1024 caracteres." };
  }
  if (footer.length > 60) {
    return { error: "O rodapé passa de 60 caracteres." };
  }
  if (placeholders(footer).length > 0) {
    return { error: "O rodapé não aceita variável." };
  }

  const names = placeholders(body);
  const missing = names.find((item) => !input.examples[item]?.trim());
  if (missing) {
    return { error: `Informe um exemplo para {{${missing}}}.` };
  }

  const numeric = names.every((item) => /^\d+$/.test(item));
  const named = names.every((item) => /^[a-z][a-z0-9_]*$/.test(item));
  if (names.length > 0 && !numeric && !named) {
    return {
      error: "Use só {{1}} e {{2}}, ou só nomes como {{cliente}}. Não misture os dois.",
    };
  }

  const component: {
    type: "BODY";
    text: string;
    example?:
      | { body_text: string[][] }
      | { body_text_named_params: { param_name: string; example: string }[] };
  } = { type: "BODY", text: body };

  if (numeric && names.length > 0) {
    const ordered = [...names].sort((left, right) => Number(left) - Number(right));
    component.example = {
      body_text: [ordered.map((item) => input.examples[item].trim())],
    };
  }
  if (named && names.length > 0) {
    component.example = {
      body_text_named_params: names.map((item) => ({
        param_name: item,
        example: input.examples[item].trim(),
      })),
    };
  }

  const components: object[] = [component];
  if (footer) {
    components.push({ type: "FOOTER", text: footer });
  }

  return {
    payload: {
      name,
      category,
      language,
      allow_category_change: true,
      ...(names.length > 0
        ? { parameter_format: numeric ? "POSITIONAL" : "NAMED" }
        : {}),
      components,
    },
  };
}
