interface IPublicLayoutProps {
    children: React.ReactNode;
}

export default function PublicLayout({ children }: Readonly<IPublicLayoutProps>): React.ReactElement {
    return <>{children}</>;
}
