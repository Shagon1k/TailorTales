import clsx from 'clsx';
import styles from './Icon.module.scss';

export type TIconName =
    | 'bell'
    | 'book'
    | 'bookshelf'
    | 'card'
    | 'children'
    | 'contact'
    | 'delete'
    | 'globe'
    | 'help'
    | 'key'
    | 'lock'
    | 'menu'
    | 'openBookPen'
    | 'pen'
    | 'planCard'
    | 'shield'
    | 'signOut'
    | 'steps'
    | 'tag'
    | 'user';

export type TIconSize = 'sm' | 'md' | 'lg';
export type TIconTone = 'current' | 'accent' | 'danger';

export interface IIconProps {
    name: TIconName;
    size?: TIconSize;
    tone?: TIconTone;
}

const ICON_PATHS: Record<TIconName, React.ReactNode> = {
    bell: (
        <>
            <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
            <path d="M10 19a2 2 0 0 0 4 0" />
        </>
    ),
    book: (
        <>
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3z" />
            <path d="M4 5.5V22" />
            <path d="M8 7h8" />
            <path d="M8 11h7" />
        </>
    ),
    bookshelf: (
        <>
            <path d="M4 19.5h16" />
            <path d="M5.5 6.5h3.2v13H5.5z" />
            <path d="M8.7 8.2h2.9v11.3H8.7z" />
            <path d="M11.8 6h3.2v13.5h-3.2z" />
            <path d="m15.4 8.1 2.8-.7 2.3 11.3-2.8.6z" />
            <path d="M6.4 9.2h1.4" />
            <path d="M12.7 9.2h1.4" />
            <path d="M12.7 16.2h1.4" />
            <path d="m17 10.8 1.2-.3" />
        </>
    ),
    card: (
        <>
            <rect x="3" y="6" width="18" height="12" rx="2.5" />
            <path d="M3 10h18" />
        </>
    ),
    children: (
        <>
            <circle cx="9" cy="9" r="3" />
            <circle cx="17" cy="10" r="2.5" />
            <path d="M3 20a6 6 0 0 1 12 0" />
            <path d="M14 20a4.5 4.5 0 0 1 7 0" />
        </>
    ),
    contact: (
        <>
            <path d="M4 6h16v12H4z" />
            <path d="m4 7 8 6 8-6" />
        </>
    ),
    delete: (
        <>
            <path d="M4 7h16" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
            <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        </>
    ),
    globe: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15 15 0 0 1 0 20" />
            <path d="M12 2a15 15 0 0 0 0 20" />
        </>
    ),
    help: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.1 9a3 3 0 1 1 5.2 2c-.8.8-1.3 1.2-1.3 2.5" />
            <path d="M12 17h.01" />
        </>
    ),
    key: (
        <>
            <circle cx="8" cy="12" r="3.5" />
            <path d="M11.5 12H21" />
            <path d="M17 12v3" />
            <path d="M14.5 12v2" />
        </>
    ),
    lock: (
        <>
            <rect x="4" y="10" width="16" height="10" rx="2.5" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
        </>
    ),
    menu: (
        <>
            <path d="M4 12h16" />
            <path d="M4 6h16" />
            <path d="M4 18h16" />
        </>
    ),
    openBookPen: (
        <>
            <path d="M4 6.5c2.6 0 5 .6 7 2.1v10.2c-2-1.5-4.4-2.1-7-2.1z" />
            <path d="M11 8.6c2-1.5 4.4-2.1 7-2.1v5.3" />
            <path d="M11 8.6v10.2" />
            <path d="M6.2 9.5c1 .1 2 .4 2.8.8" />
            <path d="M13.2 10.3c.9-.4 1.8-.7 2.8-.8" />
            <path d="m14.3 18.8 5.9-5.9 1.8 1.8-5.9 5.9-2.4.6z" />
            <path d="m19.1 14 1.8 1.8" />
        </>
    ),
    pen: (
        <>
            <path d="m12 20 9-9-8-8-9 9-2 10z" />
            <path d="m15 6 3 3" />
            <path d="m4 20 5-1" />
        </>
    ),
    planCard: (
        <>
            <path d="M7 4h10v17l-5-3-5 3z" />
            <path d="M10 8h4" />
        </>
    ),
    shield: <path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6z" />,
    signOut: (
        <>
            <path d="M10 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
            <path d="M21 12H9" />
            <path d="m16 7 5 5-5 5" />
        </>
    ),
    tag: (
        <>
            <path d="M20 12 12 20 4 12V4h8z" />
            <path d="M8 8h.01" />
        </>
    ),
    steps: (
        <>
            <path d="M5 6.5c2.7 0 5 .7 7 2.2v10.1c-2-1.5-4.3-2.2-7-2.2z" />
            <path d="M12 8.7c2-1.5 4.3-2.2 7-2.2v10.1c-2.7 0-5 .7-7 2.2z" />
        </>
    ),
    user: (
        <>
            <path d="M20 21a8 8 0 0 0-16 0" />
            <path d="M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
        </>
    ),
};

export default function Icon({
    name,
    size = 'md',
    tone = 'current',
}: Readonly<IIconProps>): React.ReactElement {
    return (
        <svg
            className={clsx(styles.icon, styles[`m-${size}`], styles[`m-${tone}`])}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ICON_PATHS[name]}
        </svg>
    );
}
