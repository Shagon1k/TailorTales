import AccountSidebar from './_components/AccountSidebar/AccountSidebar';
import styles from './layout.module.scss';

interface IAccountLayoutProps {
    children: React.ReactNode;
}

export default function AccountLayout({
    children,
}: Readonly<IAccountLayoutProps>): React.ReactElement {
    return (
        <div className={styles.account}>
            <div className={styles.account__hero}>
                <div className={styles['account__hero-inner']}>
                    <span className={styles.account__eyebrow}>· Account ·</span>
                    <h1 className={styles.account__heading}>
                        Your workshop, settled the way you like.
                    </h1>
                    <p className={styles.account__subtitle}>
                        Manage your profile, children, and preferences.
                    </p>
                </div>
            </div>
            <div className={styles.account__body}>
                <div className={styles['account__body-inner']}>
                    <AccountSidebar />
                    <div className={styles.account__content}>{children}</div>
                </div>
            </div>
        </div>
    );
}
