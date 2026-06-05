import type { Metadata } from 'next';
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import ContactSection from './_components/ContactSection/ContactSection';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage(): React.ReactElement {
    return (
        <>
            <PageHero
                eyebrow="Say hello"
                heading={
                    <>
                        Get <HeroHighlight>in touch</HeroHighlight>.
                    </>
                }
                sub="A question, a suggestion, or just a hello — we read every message."
            />
            <ContactSection email="hello@tailortales.app" />
        </>
    );
}
