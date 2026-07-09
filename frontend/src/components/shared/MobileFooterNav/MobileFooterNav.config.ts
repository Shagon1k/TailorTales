import type { TIconName } from '@/components/ui/Icon/Icon';

export type TNavRoute = 'library' | 'workshop' | 'pricing' | 'howItWorks' | 'account' | 'more';

type TTranslate = (key: string) => string;

export interface INavLink {
    href: string;
    label: string;
    icon: TIconName;
}

export interface IPrimaryLink extends INavLink {
    route: Exclude<TNavRoute, 'account' | 'more'>;
}

export const SECONDARY_ROUTES = ['/pricing', '/how-it-works', '/contact', '/privacy'];
export const PUBLIC_SECONDARY_ROUTES = ['/contact', '/privacy'];

export function getPrimaryLinks(t: TTranslate): IPrimaryLink[] {
    return [
        { route: 'library', href: '/library', label: t('items.library'), icon: 'bookshelf' },
        { route: 'workshop', href: '/workshop', label: t('items.workshop'), icon: 'openBookPen' },
    ];
}

export function getPublicPrimaryLinks(t: TTranslate): IPrimaryLink[] {
    return [
        { route: 'howItWorks', href: '/how-it-works', label: t('items.howItWorks'), icon: 'steps' },
        { route: 'pricing', href: '/pricing', label: t('items.pricing'), icon: 'planCard' },
    ];
}

export function getMoreLinks(t: TTranslate): INavLink[] {
    return [
        { href: '/pricing', label: t('items.pricing'), icon: 'tag' },
        { href: '/how-it-works', label: t('items.howItWorks'), icon: 'help' },
        { href: '/contact', label: t('items.contact'), icon: 'contact' },
        { href: '/privacy', label: t('items.privacy'), icon: 'shield' },
    ];
}

export function getPublicMoreLinks(t: TTranslate): INavLink[] {
    return [
        { href: '/contact', label: t('items.contact'), icon: 'contact' },
        { href: '/privacy', label: t('items.privacy'), icon: 'shield' },
    ];
}

export function getAccountLinks(tAccount: TTranslate): INavLink[] {
    return [
        { href: '/account/profile', label: tAccount('nav.profile'), icon: 'user' },
        { href: '/account/children', label: tAccount('nav.children'), icon: 'children' },
        { href: '/account/subscription', label: tAccount('nav.subscription'), icon: 'card' },
        { href: '/account/notifications', label: tAccount('nav.notifications'), icon: 'bell' },
        { href: '/account/privacy', label: tAccount('nav.privacy'), icon: 'lock' },
    ];
}
