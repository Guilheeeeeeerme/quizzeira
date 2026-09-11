import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { SUPPORTED_LOCALES, useLocale, useT } from "../i18n";
import type { Locale } from "../i18n";
import { AlertDialog, Button, IconButton, Text } from "../ui";
import styles from "./AppShell.module.css";

const localeLabels: Record<Locale, string> = {
  en: "English",
  pt: "Português",
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 16 16'%3E%3Cpath stroke='%238a8f98' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m4.5 6.5 3.5 3.5 3.5-3.5'/%3E%3C/svg%3E\")";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = useT();
  const location = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const languageId = useId();
  const menuId = useId();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        userMenuButtonRef.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target || userMenuRef.current?.contains(target)) return;
      setUserMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!navOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  }

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? t("Quizzeira");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label={t("Primary")}>
        <div className={styles.sidebarBrand}>
          <p className={styles.sidebarBrandName}>{t("Quizzeira")}</p>
          <h1 className={styles.sidebarSubtitle}>{t("Exam study")}</h1>
        </div>
        <nav className={styles.sidebarNav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
            }
          >
            {t("Open exams")}
          </NavLink>
          <NavLink
            to="/topics"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
            }
          >
            {t("My studies")}
          </NavLink>
          <NavLink
            to="/progress"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
            }
          >
            {t("Progress")}
          </NavLink>
          {user?.role === "ADMIN" ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
              }
            >
              {t("Admin")}
            </NavLink>
          ) : null}
        </nav>
      </aside>

      <div className={styles.column}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerStart}>
              <IconButton
                label={t("Open navigation menu")}
                className={styles.menuButton}
                onClick={() => setNavOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <Text size="body" className={styles.mobileBrand}>
                {t("Quizzeira")}
              </Text>
            </div>

            <div className={styles.actions}>
              {user ? (
                <div className={styles.userMenu} ref={userMenuRef}>
                  <Button
                    ref={userMenuButtonRef}
                    size="sm"
                    variant="ghost"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-controls={menuId}
                    onClick={() => setUserMenuOpen((open) => !open)}
                    className={styles.userTrigger}
                  >
                    {displayName}
                  </Button>
                  {userMenuOpen ? (
                    <div id={menuId} role="menu" className={styles.userPanel}>
                      <div className={styles.userEmail}>{user.email}</div>
                      <div className={styles.userSection}>
                        <label className={styles.userLabel} htmlFor={languageId}>
                          {t("Language")}
                        </label>
                        <select
                          id={languageId}
                          className={styles.userSelect}
                          value={locale}
                          style={{ backgroundImage: CHEVRON }}
                          onChange={(event) => setLocale(event.target.value as Locale)}
                        >
                          {SUPPORTED_LOCALES.map((code) => (
                            <option key={code} value={code}>
                              {localeLabels[code]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        role="menuitem"
                        className={styles.userItem}
                        onClick={() => {
                          setUserMenuOpen(false);
                          setConfirmLogout(true);
                        }}
                      >
                        {t("Log out")}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {navOpen ? (
          <button
            type="button"
            aria-label={t("Close navigation menu")}
            className={styles.scrim}
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <aside
          className={[styles.drawer, navOpen ? styles.drawerOpen : ""].filter(Boolean).join(" ")}
          aria-label={t("Primary")}
        >
          <div className={styles.drawerHeader}>
            <p className={styles.drawerTitle}>{t("Menu")}</p>
            <Button size="sm" variant="ghost" onClick={() => setNavOpen(false)}>
              {t("Close")}
            </Button>
          </div>
          <nav className={styles.sidebarNav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
              }
              onClick={() => setNavOpen(false)}
            >
              {t("Open exams")}
            </NavLink>
            <NavLink
              to="/topics"
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
              }
              onClick={() => setNavOpen(false)}
            >
              {t("My studies")}
            </NavLink>
            <NavLink
              to="/progress"
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
              }
              onClick={() => setNavOpen(false)}
            >
              {t("Progress")}
            </NavLink>
          </nav>
        </aside>

        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>

      <AlertDialog
        open={confirmLogout}
        title={t("Log out?")}
        description={t("You will need to sign in again to continue your quizzes.")}
        confirmLabel={t("Log out")}
        cancelLabel={t("Cancel")}
        loading={loggingOut}
        onConfirm={() => void handleLogout()}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
