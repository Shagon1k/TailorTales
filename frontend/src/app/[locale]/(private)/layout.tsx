import AuthGuard from './_components/AuthGuard/AuthGuard';
import Header from '@/components/shared/Header/Header';
import Footer from '@/components/shared/Footer/Footer';
import styles from './layout.module.scss';

interface IPrivateLayoutProps {
    children: React.ReactNode;
}

export default function PrivateLayout({
    children,
}: Readonly<IPrivateLayoutProps>): React.ReactElement {
    return (
        <AuthGuard>
            <Header variant="private" />
            <main className={styles.main}>{children}</main>
            <Footer />
        </AuthGuard>
    );
}
