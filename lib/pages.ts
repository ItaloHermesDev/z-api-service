export type AppPage = {
  id: string;
  title: string;
  href: string;
  description: string;
  adminOnly?: boolean;
};

export const APP_PAGES: AppPage[] = [
  {
    id: "painel",
    title: "Painel",
    href: "/",
    description: "Visão geral da conta e do que ainda falta conectar.",
  },
  {
    id: "canais",
    title: "Canais",
    href: "/canais",
    description: "Números e canais de mensagem.",
  },
  {
    id: "templates",
    title: "Templates",
    href: "/templates",
    description: "Mensagens da API oficial e a aprovação da Meta.",
  },
  {
    id: "interacoes",
    title: "Conversas",
    href: "/interacoes",
    description: "Conversas e o template que iniciou cada uma.",
  },
  {
    id: "gastos",
    title: "Gastos",
    href: "/gastos",
    description: "Quanto cada template gastou, pelo número de envios.",
  },
  {
    id: "rotas",
    title: "Rotas",
    href: "/rotas",
    description: "Endereços para receber mensagens e disparar templates.",
  },
  {
    id: "manual",
    title: "Manual",
    href: "/manual",
    description: "Explicação de cada aba, do acesso e do disparo.",
  },
  {
    id: "usuarios",
    title: "Usuários",
    href: "/usuarios",
    description: "Contas e o que cada pessoa pode ver.",
    adminOnly: true,
  },
];

export type AccessSnapshot = {
  isAdmin: boolean;
  pageIds: string[];
};

export function assignablePages() {
  return APP_PAGES.filter((page) => !page.adminOnly);
}

export function pageById(pageId: string) {
  return APP_PAGES.find((page) => page.id === pageId);
}

export function visiblePages(access: AccessSnapshot) {
  if (access.isAdmin) {
    return APP_PAGES;
  }

  const allowed = new Set(access.pageIds);
  return APP_PAGES.filter((page) => !page.adminOnly && allowed.has(page.id));
}

export function canSeePage(access: AccessSnapshot, pageId: string) {
  return visiblePages(access).some((page) => page.id === pageId);
}

export function landingPath(access: AccessSnapshot) {
  return visiblePages(access)[0]?.href ?? "/sem-acesso";
}
