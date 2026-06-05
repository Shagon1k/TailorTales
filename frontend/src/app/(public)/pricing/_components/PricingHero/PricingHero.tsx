import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';

export default function PricingHero(): React.ReactElement {
    return (
        <PageHero
            eyebrow="Pay per tale or join the Story Hour"
            heading={
                <>
                    Priced like a <HeroHighlight>small workshop</HeroHighlight>.
                </>
            }
            sub="Tales are sold by the page, or in a small monthly bundle. No tricks, no per-book add-ons, no hidden seats. Cancel any time — your shelf stays yours."
        />
    );
}
