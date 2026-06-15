import Header from '@/components/shared/Header/Header';
import Footer from '@/components/shared/Footer/Footer';
import SidebarLayout from '@/components/shared/SidebarLayout/SidebarLayout';
import AdminGuard from './_components/AdminGuard/AdminGuard';
import AdminSidebar from './_components/AdminSidebar/AdminSidebar';

interface IAdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: Readonly<IAdminLayoutProps>): React.ReactElement {
    return (
        <AdminGuard>
            <Header variant="private" />
            <main>
                <SidebarLayout
                    eyebrow="Admin"
                    heading="Control room"
                    subtitle="Manage users, stories, art styles, and content."
                    sidebar={<AdminSidebar />}
                >
                    {children}
                </SidebarLayout>
            </main>
            <Footer />
        </AdminGuard>
    );
}
