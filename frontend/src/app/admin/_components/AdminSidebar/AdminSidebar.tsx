'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import styles from './AdminSidebar.module.scss';

interface INavItem {
    href: string;
    label: string;
}

const NAV_ITEMS: INavItem[] = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/stories', label: 'Stories' },
    { href: '/admin/art-styles', label: 'Art styles' },
    { href: '/admin/ratings', label: 'Ratings' },
    { href: '/admin/blueprints', label: 'Blueprints' },
];

export default function AdminSidebar(): React.ReactElement {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <nav aria-label="Admin navigation">
                <ul className={styles.sidebar__nav}>
                    {NAV_ITEMS.map((item) => {
                        // Dashboard is an exact match; sections also match their nested routes.
                        const isActive =
                            item.href === '/admin'
                                ? pathname === '/admin'
                                : pathname.startsWith(item.href);

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={clsx(styles['sidebar__nav-item'], {
                                        [styles['m-active']]: isActive,
                                    })}
                                >
                                    <span
                                        className={styles['sidebar__nav-icon']}
                                        aria-hidden="true"
                                    />
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
