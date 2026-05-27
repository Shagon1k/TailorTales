import PageHero from '@/components/ui/PageHero/PageHero';
import PrivacyContent from './_components/PrivacyContent/PrivacyContent';

export default function PrivacyPage(): React.ReactElement {
    return (
        <>
            <PageHero
                eyebrow="· Quiet matters ·"
                heading="Your family's data is yours."
                sub="Short version: we collect only what we need to make the tales, we never sell it, and you can delete everything at any time."
            />
            <PrivacyContent />
        </>
    );
}
