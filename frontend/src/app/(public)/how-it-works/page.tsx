import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import CtaSection from '../_components/CtaSection/CtaSection';
import DetailedStepsSection from './_components/DetailedStepsSection/DetailedStepsSection';

export default function HowItWorksPage(): React.ReactElement {
    return (
        <>
            <PageHero
                eyebrow="How it works"
                heading={
                    <>
                        Three <HeroHighlight>small steps</HeroHighlight>,
                        <br />
                        one <HeroHighlight>lasting tale</HeroHighlight>.
                    </>
                }
                sub="No accounts to configure, no prompts to engineer. You answer three questions and the workshop does the rest."
            />
            <DetailedStepsSection />
            <CtaSection />
        </>
    );
}
