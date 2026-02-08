import React from 'react';
import clsx from 'clsx';

const navItems = [
    { name: '首頁', href: '/' },
    { name: '履歷', href: '/resume' },
    { name: '關於我', href: '/about' },
];

export default function NavBar() {
    const [activeTab, setActiveTab] = React.useState('');

    React.useEffect(() => {
        const path = window.location.pathname;
        // Simple matching
        if (path === '/') setActiveTab('首頁');
        else if (path.startsWith('/resume')) setActiveTab('履歷');
        else if (path.startsWith('/about')) setActiveTab('關於我');
        else setActiveTab('');
    }, []);

    return (
        <nav className="flex justify-between items-center py-6 px-4 max-w-5xl mx-auto">
            <div className="flex gap-6">
                {navItems.map((item) => (
                    <a
                        key={item.name}
                        href={item.href}
                        className={clsx(
                            "text-lg leading-8 font-medium transition-colors hover:text-rose-500",
                            activeTab === item.name ? "text-rose-500" : "text-zinc-500"
                        )}
                    >
                        {item.name}
                    </a>
                ))}
            </div>
        </nav>
    );
}
