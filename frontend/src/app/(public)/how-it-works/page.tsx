import PageHero from '@/components/ui/PageHero/PageHero';
import CtaSection from '../_components/CtaSection/CtaSection';
import DetailedStepsSection from './_components/DetailedStepsSection/DetailedStepsSection';

export default function HowItWorksPage(): React.ReactElement {
    return (
        <>
            <PageHero
                eyebrow="· The workshop ·"
                heading="Three small steps, one lasting tale."
                sub="No accounts to configure, no prompts to engineer. You answer three questions and the workshop does the rest."
            />
            <DetailedStepsSection />
            <CtaSection />
        </>
    );
}
