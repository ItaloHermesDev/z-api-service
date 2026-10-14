"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { AvatarMark } from "@/app/components/avatar-mark";

export function AppMenu({
  name,
  email,
  accessName,
  avatar,
  items,
  children,
}: {
  name: string;
  email: string;
  accessName: string;
  avatar: string;
  items: Array<{ id: string; href: string; title: string }>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1019px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setNavOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!narrow) {
      setNavOpen(false);
    }
  }, [narrow]);

  useEffect(() => {
    if (!navOpen) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  useEffect(() => {
    if (!userOpen) {
      return;
    }
    function onPointer(event: MouseEvent) {
      if (!userRef.current?.contains(event.target as Node)) {
        setUserOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [userOpen]);

  return (
    <div className="kp-shell">
      <div className={navOpen ? "kp-top-slot is-open" : "kp-top-slot"}>
        <header id="kp-account" className="kp-top">
          <button
            type="button"
            className="kp-burger"
            aria-expanded={navOpen}
            aria-controls="kp-nav"
            aria-label={navOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setNavOpen((value) => !value)}
          >
            <i />
          </button>
          <div className="kp-brand">
            <img src="/logo_nome.png" alt="Omini Z Service" width={2172} height={724} className="kp-logo-name" />
            <img src="/logo.png" alt="Omini Z Service" width={1536} height={1024} className="kp-logo-mark" />
          </div>
          <div className="kp-top-actions">
            <div className="kp-user" ref={userRef}>
              <button
                type="button"
                className="kp-user-button"
                aria-expanded={userOpen}
                aria-haspopup="menu"
                onClick={() => setUserOpen((value) => !value)}
              >
                <AvatarMark id={avatar} />
                <span className="kp-user-name">{name}</span>
              </button>
              {userOpen ? (
                <div className="kp-dropdown" role="menu">
                  <p className="kp-dropdown-email">{email}</p>
                  <p className="kp-dropdown-role">{accessName}</p>
                  <form action={logout}>
                    <button type="submit" role="menuitem">
                      Sair
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </header>
      </div>
      {narrow && navOpen ? (
        <button type="button" className="kp-backdrop" aria-label="Fechar menu" onClick={() => setNavOpen(false)} />
      ) : null}
      <nav id="kp-nav" className={navOpen ? "kp-nav is-open" : "kp-nav"} inert={narrow && !navOpen ? true : undefined}>
        <div className="kp-nav-track">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isCurrent(pathname, item.href) ? "is-current" : undefined}
            >
              <MenuIcon id={item.id} />
              {item.title}
            </Link>
          ))}
        </div>
      </nav>
      <div key={pathname} className="kp-page" inert={narrow && navOpen ? true : undefined}>
        {children}
      </div>
    </div>
  );
}

function isCurrent(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon({ id }: { id: string }) {
  return (
    <span className="kp-nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        {iconPaths(id)}
      </svg>
    </span>
  );
}

function iconPaths(id: string): ReactNode {
  if (id === "canais") {
    return (
      <>
        <circle cx="12" cy="12" r="2.2" />
        <path d="M7.2 7.2a6.8 6.8 0 0 0 0 9.6M16.8 7.2a6.8 6.8 0 0 1 0 9.6" />
      </>
    );
  }
  if (id === "templates") {
    return (
      <>
        <path d="M7 3.5h7.2L19 8.2V20.5H7z" />
        <path d="M14 3.8V8.4h4.4" />
      </>
    );
  }
  if (id === "interacoes") {
    return <path d="M5 6.5h10.5a2 2 0 0 1 2 2V14H8.2L5 16.8z" />;
  }
  if (id === "gastos") {
    return (
      <>
        <rect x="3.5" y="6" width="17" height="12" rx="1.6" />
        <path d="M3.5 10h17" />
      </>
    );
  }
  if (id === "rotas") {
    return (
      <>
        <circle cx="6" cy="7" r="2" />
        <circle cx="18" cy="12" r="2" />
        <circle cx="6" cy="17" r="2" />
        <path d="M8 7.4 16 11.2M8 16.6 16 12.8" />
      </>
    );
  }
  if (id === "manual") {
    return (
      <>
        <path d="M5 5.2h6.2A2.2 2.2 0 0 1 13.4 7.4V19a2 2 0 0 0-2.2-1.6H5z" />
        <path d="M19 5.2h-6.2A2.2 2.2 0 0 0 10.6 7.4V19a2 2 0 0 1 2.2-1.6H19z" />
      </>
    );
  }
  if (id === "usuarios") {
    return (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19.2c1.2-2.8 3.5-4.2 6.5-4.2s5.3 1.4 6.5 4.2" />
      </>
    );
  }
  return <path d="M4.5 10.6 12 4.5l7.5 6.1V19.5h-5.2v-5.2H9.7v5.2H4.5z" />;
}
