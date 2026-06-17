import { getTranslations } from 'next-intl/server';
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';

export default async function PricingHero(): Promise<React.ReactElement> {
    const t = await getTranslations('pricing.hero');

    return (
        <PageHero
            eyebrow={t('eyebrow')}
            heading={t.rich('heading', {
                highlight: (chunks) => <HeroHighlight>{chunks}</HeroHighlight>,
            })}
            sub={t('subheading')}
        />
    );
}
