import PageHero from '@/components/ui/PageHero/PageHero';
import ContactSection from './_components/ContactSection/ContactSection';

export default function ContactPage(): React.ReactElement {
    return (
        <>
            <PageHero
                eyebrow="· Say hello ·"
                heading="Get in touch."
                sub="A question, a suggestion, or just a hello — we read every message."
            />
            <ContactSection email="hello@tailortales.app" />
        </>
    );
}
