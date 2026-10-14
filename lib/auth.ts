import "server-only";
import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { canSeePage, landingPath } from "@/lib/pages";
import { getSession } from "@/lib/session";
import { findUserById } from "@/lib/users";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  accessName: string;
  pageIds: string[];
  avatar: string;
};

export async function getOptionalUser(): Promise<CurrentUser | null> {
  "use cache: private";
  cacheLife("seconds");

  const { userId } = await getSession();
  if (!userId) {
    return null;
  }

  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    accessName: user.accessName,
    pageIds: user.pageIds,
    avatar: user.avatar,
  };
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePage(pageId: string) {
  const user = await getCurrentUser();
  if (!canSeePage(user, pageId)) {
    redirect(landingPath(user));
  }
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user.isAdmin) {
    redirect(landingPath(user));
  }
  return user;
}
