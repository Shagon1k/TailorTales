import AuthGuard from '@/components/AuthGuard/AuthGuard';

interface IProtectedLayoutProps {
    children: React.ReactNode;
}

export default function ProtectedLayout({ children }: IProtectedLayoutProps): React.ReactElement {
    return <AuthGuard>{children}</AuthGuard>;
}
