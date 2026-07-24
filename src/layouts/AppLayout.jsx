import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck2,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CreditCard,
  Gauge,
  Globe2,
  HelpCircle,
  History,
  Home,
  GraduationCap,
  Layers3,
  ListTodo,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Search,
  Settings,
  Shield,
  UserPlus,
  Users,
  Video,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HelpCenterDrawer, NotificationDrawer, SearchCommandOverlay } from "../components/WorkspaceOperations";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { roleDestination } from "../domain/organization";

const icons = {
  dashboard: Gauge,
  home: Home,
  rooms: Building2,
  files: BookOpen,
  members: Users,
  courses: GraduationCap,
  batches: Layers3,
  bookingRequests: CalendarCheck2,
  announcements: Megaphone,
  meetings: Video,
  tasks: ListTodo,
  notifications: Bell,
  calendar: Calendar,
  bookings: CalendarCheck2,
  analytics: BarChart3,
  security: Shield,
  subscription: CreditCard,
  settings: Settings,
  locked: Shield,
  invites: UserPlus,
  activity: History
};

export function AppLayout({ appTitle, user, nav, children }) {
  const { logout } = useAuth();
  const { direction, language, t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { notifications } = useWorkspace();
  const { memberships, activeOrganization, selectOrganization } = useOrganization();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const accountRef = useRef(null);
  const workspaceRef = useRef(null);
  const navigate = useNavigate();
  const workspaceName = activeOrganization?.name || user.company || "AIO SaaS";
  const rolePath = user.role === "super-admin" ? "/super-admin" : user.role === "tenant-admin" ? "/tenant-admin" : "/end-user";
  const unreadCount = notifications.filter((item) => item.unread && item.target?.startsWith(rolePath)).length;

  useEffect(() => {
    const closeAccount = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
      if (!workspaceRef.current?.contains(event.target)) setWorkspaceOpen(false);
    };
    document.addEventListener("pointerdown", closeAccount);
    return () => document.removeEventListener("pointerdown", closeAccount);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setCommandOpen(false);
        setNotificationsOpen(false);
        setHelpOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navLabel = (item) => t.shell[item.id] || item.label;
  const switchWorkspace = (membership) => {
    selectOrganization(membership.organizationId);
    setWorkspaceOpen(false);
    navigate(roleDestination(membership.role));
  };

  return (
    <div className={`stitch-shell shell-${language}`} dir={direction}>
      {mobileOpen && <button className="stitch-mobile-overlay" type="button" onClick={() => setMobileOpen(false)} aria-label={`${t.shell.closeMenu} overlay`} />}
      <aside className={`stitch-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="stitch-brand">
          <div className="stitch-brand-icon"><img src="/images/aio-logo-64.png" alt="" /></div>
          <div><strong>AIO SaaS</strong><span>{workspaceName}</span></div>
          <button className="stitch-sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label={t.shell.closeMenu}><X size={20} /></button>
        </div>

        <nav className="stitch-nav" aria-label={`${appTitle} navigation`}>
          {nav.map((item) => {
            const Icon = icons[item.icon] || Gauge;
            return <NavLink onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? "stitch-nav-item active" : "stitch-nav-item"} key={item.id} to={item.path}><Icon size={22} /><span>{navLabel(item)}</span></NavLink>;
          })}
        </nav>

        <div className="stitch-sidebar-bottom">
          <button className="stitch-nav-item stitch-help-link" type="button" onClick={() => setHelpOpen(true)}><HelpCircle size={22} /><span>{t.shell.help}</span></button>
          {appTitle !== "End User" && <button className="stitch-upgrade" type="button" onClick={() => navigate(nav.find((item) => item.id === "subscription" || item.id === "subscriptions")?.path || "#")}>{t.shell.upgrade}</button>}
        </div>
      </aside>

      <main className="stitch-main">
        <header className="stitch-topbar">
          <button className="stitch-mobile-menu" type="button" onClick={() => setMobileOpen(true)} aria-label={t.shell.menu}><Menu size={22} /></button>
          {user.role !== "super-admin" && activeOrganization && <div className="workspace-switcher" ref={workspaceRef}>
            <button type="button" onClick={() => setWorkspaceOpen((value) => !value)} aria-expanded={workspaceOpen}>
              <span style={{ backgroundColor: activeOrganization.color }}>{activeOrganization.logo}</span>
              <div><strong>{workspaceName}</strong><small>{activeOrganization.plan}</small></div>
              <ChevronDown size={16} />
            </button>
            {workspaceOpen && <div className="workspace-switcher-menu">
              <header><strong>{language === "ar" ? "مساحات العمل" : "Workspaces"}</strong><small>{memberships.length}</small></header>
              {memberships.map((membership) => <button className={membership.organizationId === activeOrganization.id ? "active" : ""} type="button" onClick={() => switchWorkspace(membership)} key={membership.organizationId}><span style={{ backgroundColor: membership.organization.color }}>{membership.organization.logo}</span><div><strong>{language === "ar" ? membership.organization.nameAr : membership.organization.name}</strong><small>{membership.organization.plan}</small></div>{membership.organizationId === activeOrganization.id && <Check size={16} />}</button>)}
              <button className="workspace-manage-link" type="button" onClick={() => { setWorkspaceOpen(false); navigate("/workspaces"); }}><ChevronsUpDown size={17} /> {language === "ar" ? "إدارة واختيار المساحات" : "Manage workspaces"}</button>
            </div>}
          </div>}
          <button className="stitch-search" type="button" onClick={() => setSearchOpen(true)} aria-label={t.shell.searchLabel}><Search size={22} /><span>{t.shell.search}</span><kbd>Ctrl K</kbd></button>
          <div className="stitch-top-actions">
            <button className="stitch-lang-toggle" onClick={toggleLanguage} type="button" aria-label={t.common.language}>{language === "ar" ? "English" : "العربية"}<Globe2 size={18} /></button>
            <button className="stitch-icon-button" onClick={toggleTheme} type="button" aria-label={t.shell.appearance}><Moon size={22} /></button>
            <button className={`stitch-icon-button ${unreadCount ? "has-dot" : ""}`} type="button" onClick={() => setNotificationsOpen(true)} aria-label={t.shell.notifications}><Bell size={22} />{unreadCount > 0 && <small>{Math.min(unreadCount, 9)}</small>}</button>
            <span className="stitch-divider" />
            <div className="stitch-account-wrap" ref={accountRef}>
              <button className="stitch-profile" onClick={() => setAccountOpen((value) => !value)} type="button" aria-expanded={accountOpen} aria-label={t.shell.accountMenu}>
                <i>{user.avatar ? <img src={user.avatar} alt="" /> : user.name.slice(0, 2).toUpperCase()}</i>
                <span><strong>{user.name}</strong><small>{user.roleLabel || user.role}</small></span>
              </button>
              {accountOpen && <div className="stitch-account-menu">
                <div className="stitch-account-head"><i>{user.avatar ? <img src={user.avatar} alt="" /> : user.name.slice(0, 2).toUpperCase()}</i><div><strong>{user.name}</strong><span>{theme === "dark" ? t.common.dark : t.common.light} · {t.common.online}</span></div></div>
                <NavLink onClick={() => setAccountOpen(false)} to={nav.find((item) => item.id === "settings")?.path || "#"}><Settings size={17} />{t.shell.settings}</NavLink>
                <button onClick={toggleTheme} type="button"><Moon size={17} />{t.shell.appearance}</button>
                <button className="account-logout" onClick={handleLogout} type="button"><LogOut size={16} /> {t.shell.logout}</button>
              </div>}
            </div>
          </div>
        </header>

        <div className="stitch-content">{children}</div>
        <footer className="stitch-footer"><div><strong>AIO SaaS</strong><span>© 2026 AIO SaaS Solutions. {t.shell.footerRights}</span></div><nav><a href="/privacy">{t.shell.privacy}</a><a href="/terms">{t.shell.terms}</a><a href="/support">{t.shell.support}</a></nav></footer>
      </main>

      <SearchCommandOverlay open={searchOpen} onClose={() => setSearchOpen(false)} user={user} onHelp={() => setHelpOpen(true)} />
      <SearchCommandOverlay open={commandOpen} onClose={() => setCommandOpen(false)} user={user} initialMode="command" onHelp={() => setHelpOpen(true)} />
      <NotificationDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} user={user} />
      <HelpCenterDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
