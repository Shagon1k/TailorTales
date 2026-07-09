import MascotImage from '@/components/shared/MascotImage/MascotImage';
import SidebarLayout from '@/components/shared/SidebarLayout/SidebarLayout';
import AccountSidebar from './_components/AccountSidebar/AccountSidebar';

interface IAccountLayoutProps {
    children: React.ReactNode;
}

export default function AccountLayout({
    children,
}: Readonly<IAccountLayoutProps>): React.ReactElement {
    return (
        <SidebarLayout
            eyebrow="Account"
            heading="Your workshop, settled the way you like."
            subtitle="Manage your profile, children, and preferences."
            sidebar={<AccountSidebar />}
            mascot={<MascotImage image="fox-ruler" size={120} glow="outline" flip />}
            mobileContentAlignment="center"
        >
            {children}
        </SidebarLayout>
    );
}
