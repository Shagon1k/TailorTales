import Header from '@/components/shared/Header/Header';
import Footer from '@/components/shared/Footer/Footer';

interface IPublicLayoutProps {
    children: React.ReactNode;
}

export default function PublicLayout({
    children,
}: Readonly<IPublicLayoutProps>): React.ReactElement {
    return (
        <>
            <Header variant="public" />
            <main>{children}</main>
            <Footer />
        </>
    );
}
