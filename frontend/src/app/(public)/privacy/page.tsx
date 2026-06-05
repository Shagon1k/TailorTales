import type { Metadata } from 'next';
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import PrivacyContent from './_components/PrivacyContent/PrivacyContent';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage(): React.ReactElement {
    return (
        <>
            <PageHero
                eyebrow="Quiet matters"
                heading={
                    <>
                        Your family&apos;s <HeroHighlight>data</HeroHighlight> is{' '}
                        <HeroHighlight>yours</HeroHighlight>.
                    </>
                }
                sub="Short version: we collect only what we need to make the tales, we never sell it, and you can delete everything at any time."
            />
            <PrivacyContent />
        </>
    );
}
