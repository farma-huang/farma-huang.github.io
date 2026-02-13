import React from 'react';
import clsx from 'clsx';

const navItems = [
    { 
        name: '首頁', 
        href: '/',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
        )
    },
    { 
        name: '關於我', 
        href: '/about',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
        )
    },
];

export default function MobileBottomNav() {
    const [activeTab, setActiveTab] = React.useState('');

    React.useEffect(() => {
        const path = window.location.pathname;
        // Simple matching
        if (path === '/') setActiveTab('首頁');
        else if (path.startsWith('/about')) setActiveTab('關於我');
        else setActiveTab('');
    }, []);

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card-bg border-t border-zinc-200 lg:hidden z-50">
            <div className="flex justify-around items-center px-4 py-0.5 max-w-md mx-auto">
                {navItems.map((item) => (
                    <a
                        key={item.name}
                        href={item.href}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-all min-w-[80px]",
                            activeTab === item.name 
                                ? "text-zinc-900" 
                                : "text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        <div className={clsx(
                            "transition-transform",
                            activeTab === item.name && "scale-110"
                        )}>
                            {item.icon}
                        </div>
                        <span className="text-xs font-medium">{item.name}</span>
                    </a>
                ))}
            </div>
        </nav>
    );
}
