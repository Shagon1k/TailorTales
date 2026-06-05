import { getServerUser } from '@/api/user.server';
import HeroSection from './_components/HeroSection/HeroSection';
import LanternsSection from './_components/LanternsSection/LanternsSection';
import TalesSection from './_components/TalesSection/TalesSection';
import CtaSection from './_components/CtaSection/CtaSection';

export default async function HomePage(): Promise<React.ReactElement> {
    const user = await getServerUser();

    return (
        <>
            <HeroSection isLoggedIn={!!user} />
            <LanternsSection />
            <TalesSection />
            <CtaSection />
        </>
    );
}
