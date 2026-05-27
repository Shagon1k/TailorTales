'use client';

import Link from 'next/link';
import Button, { type IButtonProps } from './Button';

export interface IButtonLinkProps extends Omit<IButtonProps, 'component'> {
    href: string;
}

export default function ButtonLink({
    href,
    ...props
}: Readonly<IButtonLinkProps>): React.ReactElement {
    return <Button component={Link} href={href} {...props} />;
}
