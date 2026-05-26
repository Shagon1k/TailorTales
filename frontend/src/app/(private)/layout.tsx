import AuthGuard from './_components/AuthGuard/AuthGuard';
import Header from '@/components/shared/Header/Header';
import Footer from '@/components/shared/Footer/Footer';

interface IPrivateLayoutProps {
    children: React.ReactNode;
}

export default function PrivateLayout({ children }: Readonly<IPrivateLayoutProps>): React.ReactElement {
    return (
        <AuthGuard>
            <Header variant="private" />
            <main>{children}</main>
            <Footer />
        </AuthGuard>
    );
}
