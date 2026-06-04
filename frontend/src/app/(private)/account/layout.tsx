import PillLabel from '@/components/ui/PillLabel/PillLabel';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
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
                    <PillLabel>Account</PillLabel>
                    <h1 className={styles.account__heading}>
                        Your workshop, settled the way you like.
                    </h1>
                    <p className={styles.account__subtitle}>
                        Manage your profile, children, and preferences.
                    </p>
                </div>
                <div className={styles['account__hero-mascot']} aria-hidden="true">
                    <MascotImage image="fox-ruler" size={120} glow="outline" flip />
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
