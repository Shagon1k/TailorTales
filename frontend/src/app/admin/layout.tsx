import Header from '@/components/shared/Header/Header';
import Footer from '@/components/shared/Footer/Footer';
import PillLabel from '@/components/ui/PillLabel/PillLabel';
import AdminGuard from './_components/AdminGuard/AdminGuard';
import AdminSidebar from './_components/AdminSidebar/AdminSidebar';
import styles from './layout.module.scss';

interface IAdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: Readonly<IAdminLayoutProps>): React.ReactElement {
    return (
        <AdminGuard>
            <Header variant="private" />
            <main className={styles.admin}>
                <div className={styles.admin__hero}>
                    <div className={styles['admin__hero-inner']}>
                        <PillLabel>Admin</PillLabel>
                        <h1 className={styles.admin__heading}>Control room</h1>
                        <p className={styles.admin__subtitle}>
                            Manage users, stories, art styles, and content.
                        </p>
                    </div>
                </div>
                <div className={styles.admin__body}>
                    <div className={styles['admin__body-inner']}>
                        <AdminSidebar />
                        <div className={styles.admin__content}>{children}</div>
                    </div>
                </div>
            </main>
            <Footer />
        </AdminGuard>
    );
}
