import AuthGuard from './_components/AuthGuard/AuthGuard';

interface IPrivateLayoutProps {
    children: React.ReactNode;
}

export default function PrivateLayout({ children }: Readonly<IPrivateLayoutProps>): React.ReactElement {
    return <AuthGuard>{children}</AuthGuard>;
}
