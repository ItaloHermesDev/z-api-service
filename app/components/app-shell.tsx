import type { ReactNode } from "react";
import { Frame } from "@/app/components/frame";
import { getOptionalUser } from "@/lib/auth";

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await getOptionalUser();
  if (!user) {
    return children;
  }

  return <Frame user={user}>{children}</Frame>;
}
