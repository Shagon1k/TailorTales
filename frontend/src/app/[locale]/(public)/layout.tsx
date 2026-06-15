import { getServerUser } from '@/api/user.server';
import Header from '@/components/shared/Header/Header';
import Footer from '@/components/shared/Footer/Footer';

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
            <main>{children}</main>
            <Footer />
        </>
    );
}
