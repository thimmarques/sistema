
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AppSection, UserSettings, AppNotification } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    activeSection: AppSection;
    onSelectSection: (section: AppSection, tab?: string) => void;
    settings: UserSettings;
    notifications: AppNotification[];
    unreadCount: number;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    markNotificationRead: (id: string) => void;
    isLoading: boolean;
    onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
    children,
    activeSection,
    onSelectSection,
    settings,
    notifications,
    unreadCount,
    showNotifications,
    setShowNotifications,
    markNotificationRead,
    isLoading,
    onLogout
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-brand-900 font-sans text-brand-50 selection:bg-accent-gold/20 selection:text-accent-gold">
            <Sidebar
                activeSection={activeSection}
                onSelectSection={onSelectSection}
                logo={settings.logo}
                name={settings.name}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <main className="flex-1 relative h-screen flex flex-col overflow-hidden bg-brand-900">
                {isLoading && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-800 overflow-hidden z-50">
                        <div className="h-full bg-accent-gold animate-pulse origin-left"></div>
                    </div>
                )}

                <Navbar
                    activeSection={activeSection}
                    settings={settings}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    showNotifications={showNotifications}
                    setShowNotifications={setShowNotifications}
                    markNotificationRead={markNotificationRead}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                    onLogout={onLogout}
                />

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className={`max-w-[1920px] mx-auto p-4 md:p-8 transition-all duration-700 ${isLoading ? 'opacity-20 blur-sm' : 'opacity-100 blur-0'}`}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
