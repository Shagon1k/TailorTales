import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getServerUser } from '@/api/user.server';
import { storiesServerApi } from '@/api/stories.server';
import { buildMetadata } from '@/utils/seo.utils';
import HeroSection from './_components/HeroSection/HeroSection';
import LanternsSection from './_components/LanternsSection/LanternsSection';
import TalesSection from './_components/TalesSection/TalesSection';
import CtaSection from './_components/CtaSection/CtaSection';
import styles from './page.module.scss';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const [tSeo, tPage] = await Promise.all([
        getTranslations({ locale, namespace: 'seo' }),
        getTranslations({ locale, namespace: 'home.page' }),
    ]);

    return buildMetadata({
        locale,
        path: '',
        description: tPage('description'),
        siteName: tSeo('siteName'),
        ogImageAlt: tSeo('ogImageAlt'),
    });
}

export default async function HomePage(): Promise<React.ReactElement> {
    const [user, publicStories] = await Promise.all([
        getServerUser(),
        // The marketing page must render even if the API is unreachable —
        // degrade to no featured tales rather than crashing the whole page.
        storiesServerApi.getPublic().catch((err: unknown) => {
            console.error('Public stories fetch failed; rendering landing without tales', err);
            return [];
        }),
    ]);

    return (
        <>
            <p className={styles.previewMarker}>P5 preview smoke · refresh confirmed</p>
            <HeroSection isLoggedIn={!!user} />
            <LanternsSection />
            <TalesSection tales={publicStories} />
            <CtaSection />
        </>
    );
}
