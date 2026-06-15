import { getServerUser } from '@/api/user.server';
import { storiesServerApi } from '@/api/stories.server';
import HeroSection from './_components/HeroSection/HeroSection';
import LanternsSection from './_components/LanternsSection/LanternsSection';
import TalesSection from './_components/TalesSection/TalesSection';
import CtaSection from './_components/CtaSection/CtaSection';

export default async function HomePage(): Promise<React.ReactElement> {
    const [user, publicStories] = await Promise.all([
        getServerUser(),
        storiesServerApi.getPublic(),
    ]);

    return (
        <>
            <HeroSection isLoggedIn={!!user} />
            <LanternsSection />
            <TalesSection tales={publicStories} />
            <CtaSection />
        </>
    );
}
