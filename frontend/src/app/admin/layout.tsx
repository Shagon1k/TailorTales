import Header from '@/components/shared/Header/Header';
import Footer from '@/components/shared/Footer/Footer';
import AdminGuard from './_components/AdminGuard/AdminGuard';

interface IAdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: Readonly<IAdminLayoutProps>): React.ReactElement {
    return (
        <AdminGuard>
            <Header variant="private" />
            <main>{children}</main>
            <Footer />
        </AdminGuard>
    );
}
