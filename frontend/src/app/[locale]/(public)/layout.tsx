import { getServerUser } from '@/api/user.server';
import Header from '@/components/shared/Header/Header';
import Footer from '@/components/shared/Footer/Footer';
import MobileFooterNav from '@/components/shared/MobileFooterNav/MobileFooterNav';
import styles from './layout.module.scss';

interface IPublicLayoutProps {
    children: React.ReactNode;
}

export default async function PublicLayout({
    children,
}: Readonly<IPublicLayoutProps>): Promise<React.ReactElement> {
    const user = await getServerUser();

    return (
        <>
            <Header variant={user ? 'private' : 'public'} />
            <main className={styles.main}>{children}</main>
            <MobileFooterNav authenticated={Boolean(user)} />
            <Footer />
        </>
    );
}
