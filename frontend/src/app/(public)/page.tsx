import HeroSection from './_components/HeroSection/HeroSection';
import LanternsSection from './_components/LanternsSection/LanternsSection';
import TalesSection from './_components/TalesSection/TalesSection';
import CtaSection from './_components/CtaSection/CtaSection';

export default function HomePage(): React.ReactElement {
    return (
        <>
            <HeroSection />
            <LanternsSection />
            <TalesSection />
            <CtaSection />
        </>
    );
}
