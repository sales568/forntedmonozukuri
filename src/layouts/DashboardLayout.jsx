import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Factory,
    ShieldCheck,
    Wrench,
    Package,
    Users,
    HardHat,
    Lightbulb,
    DollarSign,
    ClipboardList,
    Settings,
    Menu,
    Bell,
    Search,
    LogOut,
    ChevronRight,
    KanbanSquare,
    Lock,
} from 'lucide-react';
import GenbaAssistant from '../components/GenbaAssistant';

const navSections = [
    {
        titleKey: 'nav.operations',
        items: [
            { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
            { to: '/fos', icon: FileText, labelKey: 'nav.fos' },
            { to: '/production', icon: Factory, labelKey: 'nav.production' },
            { to: '/quality', icon: ShieldCheck, labelKey: 'nav.quality' },
            { to: '/maintenance', icon: Wrench, labelKey: 'nav.maintenance' },
            { to: '/inventory', icon: Package, labelKey: 'nav.inventory' },
        ],
    },
    {
        titleKey: 'nav.support',
        items: [
            { to: '/competencies', icon: Users, labelKey: 'nav.competencies' },
            { to: '/safety', icon: HardHat, labelKey: 'nav.safety' },
            { to: '/labor', icon: Users, labelKey: 'Mano de Obra' },
            { to: '/kaizen', icon: Lightbulb, labelKey: 'nav.kaizen' },
            { to: '/phva', icon: KanbanSquare, labelKey: 'Tablero PHVA' },
        ],
    },
    {
        titleKey: 'nav.analytics',
        items: [
            { to: '/costs', icon: DollarSign, labelKey: 'nav.costs' },
            { to: '/formats', icon: ClipboardList, labelKey: 'nav.formats' },
        ],
    },
    {
        titleKey: 'nav.admin',
        items: [
            { to: '/admin/plants', icon: Factory, labelKey: 'nav.plants', roles: ['admin_global'] },
            { to: '/admin/config', icon: Settings, labelKey: 'nav.plantConfig', roles: ['admin_global', 'admin_empresa'] },
            { to: '/admin/roles', icon: Lock, labelKey: 'Roles y Funciones', roles: ['admin_global', 'admin_empresa'] },
            { to: '/admin/users', icon: Users, labelKey: 'nav.users', roles: ['admin_global', 'admin_empresa'] },
        ],
    },
];

export default function DashboardLayout() {
    const { t } = useTranslation();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Referencia para detectar clics fuera del dropdown
    const notifRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter nav sections based on user role
    const filteredNavSections = navSections.map(section => ({
        ...section,
        items: section.items.filter(item => !item.roles || item.roles.includes(user?.role))
    })).filter(section => section.items.length > 0);

    // Get current page title for breadcrumb
    const currentItem = filteredNavSections
        .flatMap((s) => s.items)
        .find((item) => location.pathname.startsWith(item.to));

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside
                className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`}
            >
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">M</div>
                    <span className="sidebar-brand-text">MONOZUKURI</span>
                </div>

                <nav className="sidebar-nav">
                    {filteredNavSections.map((section) => (
                        <div key={section.titleKey}>
                            <div className="sidebar-section-title">{t(section.titleKey)}</div>
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `sidebar-nav-item ${isActive ? 'active' : ''}`
                                    }
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className="sidebar-nav-icon" />
                                    <span className="sidebar-nav-label">{t(item.labelKey)}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main */}
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Header */}
                <header className="header" style={{ padding: '0 2rem', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                    <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button
                            className="header-toggle"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            aria-label="Toggle sidebar"
                            style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="header-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            <span className="opacity-60">MVP MONOZUKURI</span>
                            {currentItem && (
                                <>
                                    <ChevronRight size={14} className="opacity-40" />
                                    <span style={{ color: 'var(--text-main)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t(currentItem.labelKey)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Buscador Optimizado */}
                        <div className="relative hidden md:block">
                            <input
                                type="text"
                                placeholder="Buscar en Gemba..."
                                style={{
                                    padding: '8px 16px 8px 40px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-app)',
                                    fontSize: '0.875rem',
                                    width: '240px',
                                    transition: 'all 0.3s'
                                }}
                                onFocus={(e) => e.target.style.width = '320px'}
                                onBlur={(e) => e.target.style.width = '240px'}
                                onKeyDown={(e) => e.key === 'Enter' && alert(`Buscando: ${e.target.value}`)}
                            />
                            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        </div>

                        <div className="relative" ref={notifRef}>
                            <button
                                className={`header-icon-btn ${notificationsOpen ? 'bg-blue-50 text-blue-600' : ''}`}
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                aria-label="Notifications"
                                style={{ position: 'relative', padding: '10px', borderRadius: '12px', transition: 'all 0.2s' }}
                            >
                                <Bell size={18} />
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-900" />
                            </button>

                            {notificationsOpen && (
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '120%',
                                    width: '340px',
                                    backgroundColor: 'var(--bg-card)',
                                    borderRadius: '20px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid var(--border-color)',
                                    zIndex: 9999,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Centro de Notificaciones</h4>
                                        <span onClick={() => setNotificationsOpen(false)} style={{ fontSize: '10px', cursor: 'pointer', fontWeight: 800, color: '#2563eb' }}>LEÍDOS</span>
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {[
                                            { t: 'Inspección Crítica', m: 'Lote 45 detectado fuera de rango funcional.', h: '5 min', c: 'red' },
                                            { t: 'FOS Actualizada', m: 'Ingeniería publicó v2.1 de Ensamble Chasis.', h: '2 h', c: 'blue' },
                                            { t: 'Seguridad 5S', m: 'Pasillo obstruido en UET Soldadura.', h: '4 h', c: 'yellow' }
                                        ].map((n, i) => (
                                            <div key={i} style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}>
                                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: `var(--${n.c}-600)` }}>{n.t}</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', lineHeight: 1.4, opacity: 0.7 }}>{n.m}</p>
                                                <p style={{ margin: '8px 0 0 0', fontSize: '9px', fontWeight: 900, opacity: 0.4 }}>{n.h} atrás</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className="header-avatar"
                                style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}
                            >
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-[11px] font-bold leading-none uppercase tracking-tight text-gray-700 dark:text-gray-200">{user?.name || 'Usuario'}</p>
                                <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{user?.role?.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <button className="header-icon-btn" onClick={logout} title="Salir" style={{ padding: '8px', borderRadius: '10px' }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Page */}
                <main className="page-content animate-fade-in" style={{ padding: '2.5rem' }}>
                    <Outlet />
                </main>
                <GenbaAssistant />
            </div>
        </div>
    );
}

