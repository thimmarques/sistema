
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
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar
                activeSection={activeSection}
                onSelectSection={onSelectSection}
                logo={settings.logo}
                name={settings.name}
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <main className="flex-1 overflow-y-auto relative h-screen">
                {isLoading && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden z-50">
                        <div className="h-full bg-amber-500 animate-progress origin-left"></div>
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

                <div className={`p-4 md:p-8 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
