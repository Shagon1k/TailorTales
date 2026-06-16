'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import clsx from 'clsx';
import styles from './AdminSidebar.module.scss';

export default function AdminSidebar(): React.ReactElement {
    const t = useTranslations('admin.nav');
    const pathname = usePathname();

    const navItems = [
        { href: '/admin', label: t('dashboard') },
        { href: '/admin/users', label: t('users') },
        { href: '/admin/stories', label: t('stories') },
        { href: '/admin/art-styles', label: t('artStyles') },
        { href: '/admin/ratings', label: t('ratings') },
        { href: '/admin/blueprints', label: t('blueprints') },
    ];

    return (
        <aside className={styles.sidebar}>
            <nav aria-label={t('ariaLabel')}>
                <ul className={styles.sidebar__nav}>
                    {navItems.map((item) => {
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
