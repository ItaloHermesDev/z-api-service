import type { ReactNode } from "react";
import { AppMenu } from "@/app/components/nav-links";
import type { CurrentUser } from "@/lib/auth";
import { visiblePages } from "@/lib/pages";

export function Frame({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  const pages = visiblePages(user);

  return (
    <AppMenu
      name={user.name}
      email={user.email}
      accessName={user.accessName}
      avatar={user.avatar}
      items={pages.map((page) => ({ id: page.id, href: page.href, title: page.title }))}
    >
      {children}
    </AppMenu>
  );
}
