import Link from 'next/link';
import styles from './CapsLink.module.scss';

export interface ICapsLinkProps {
    href: string;
    children: React.ReactNode;
}

/** Caps-style navigational link (e.g. "Manage children →") — gold, with hover/active states. */
export default function CapsLink({ href, children }: Readonly<ICapsLinkProps>): React.ReactElement {
    return (
        <Link href={href} className={styles['caps-link']}>
            {children}
        </Link>
    );
}
