import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { SUPPORTED_LOCALES, useLocale, useT } from "../i18n";
import type { Locale } from "../i18n";
import { useTheme } from "../theme/ThemeProvider";
import { AlertDialog, Button, IconButton, Text } from "../ui";
import styles from "./AppShell.module.css";

const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
};

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13.5 9.2A5.5 5.5 0 0 1 6.8 2.5 5.6 5.6 0 1 0 13.5 9.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
  const { theme, toggleTheme } = useTheme();
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
          <h1 className={styles.sidebarSubtitle}>{t("AI Dev Quiz")}</h1>
        </div>
        <nav className={styles.sidebarNav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
            }
          >
            {t("Topics")}
          </NavLink>
          <NavLink
            to="/progress"
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.navItemActive : ""].filter(Boolean).join(" ")
            }
          >
            {t("Progress")}
          </NavLink>
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
              <IconButton
                label={theme === "dark" ? t("Switch to light mode") : t("Switch to dark mode")}
                onClick={toggleTheme}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </IconButton>

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
              {t("Topics")}
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
