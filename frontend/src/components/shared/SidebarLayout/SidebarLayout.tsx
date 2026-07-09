import PillLabel from '@/components/ui/PillLabel/PillLabel';
import clsx from 'clsx';
import styles from './SidebarLayout.module.scss';

export interface ISidebarLayoutProps {
    /** All-caps eyebrow pill above the heading. */
    eyebrow: string;
    heading: string;
    subtitle: string;
    /** The left-hand navigation column. */
    sidebar: React.ReactNode;
    /** Optional decorative mascot anchored to the hero's bottom-right. */
    mascot?: React.ReactNode;
    /** Centers the hero and narrows content on mobile/tablet when the section is app-like. */
    mobileContentAlignment?: 'start' | 'center';
    children: React.ReactNode;
}

/**
 * Hero + two-column (sidebar | content) scaffold shared by the account and admin sections.
 * Header/Footer and any route guards stay with the consuming layout.
 */
export default function SidebarLayout({
    eyebrow,
    heading,
    subtitle,
    sidebar,
    mascot,
    mobileContentAlignment = 'start',
    children,
}: Readonly<ISidebarLayoutProps>): React.ReactElement {
    return (
        <div
            className={clsx(styles.layout, {
                [styles['m-mobile-centered']]: mobileContentAlignment === 'center',
            })}
        >
            <div className={styles.layout__hero}>
                <div className={styles['layout__hero-inner']}>
                    <PillLabel>{eyebrow}</PillLabel>
                    <h1 className={styles.layout__heading}>{heading}</h1>
                    <p className={styles.layout__subtitle}>{subtitle}</p>
                </div>
                {mascot && (
                    <div className={styles['layout__hero-mascot']} aria-hidden="true">
                        {mascot}
                    </div>
                )}
            </div>
            <div className={styles.layout__body}>
                <div className={styles['layout__body-inner']}>
                    {sidebar}
                    <div className={styles.layout__content}>{children}</div>
                </div>
            </div>
        </div>
    );
}
