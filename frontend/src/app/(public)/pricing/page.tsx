import CtaSection from '../_components/CtaSection/CtaSection';
import PricingHero from './_components/PricingHero/PricingHero';
import PlansSection from './_components/PlansSection/PlansSection';
import ComparisonTable from './_components/ComparisonTable/ComparisonTable';
import FaqSection from './_components/FaqSection/FaqSection';
import type { IPricingData } from './_components/types';

// TODO: Replace with real data from GET /pricing once the backend pricing endpoint is wired.
//       The shape of PRICING_DATA mirrors the expected API response.
const PRICING_DATA: IPricingData = {
    plans: [
        {
            id: 'free',
            name: 'Free Chapter',
            tagline: 'A first tale on the workshop.',
            priceMonthly: 0,
            features: [
                '1 short tale (up to 8 pages)',
                'Watermarked PDF',
                '1 child profile',
                'All starter art styles',
                'Email + in-app delivery',
            ],
            ctaLabel: 'Begin free →',
            ctaHref: '/sign-up',
        },
        {
            id: 'story-hour',
            name: 'Story Hour',
            tagline: 'The cosy bedtime bundle.',
            priceMonthly: 8,
            features: [
                'Up to 48 pages a month',
                'Books and comics',
                'Up to 3 children',
                '10 page regenerations / month',
                'No watermark · print-ready',
                'Stories kept forever',
            ],
            ctaLabel: 'Join Story Hour →',
            ctaHref: '/sign-up?plan=story-hour',
            mostLoved: true,
        },
        {
            id: 'family',
            name: 'Family Workshop',
            tagline: 'For voracious little readers.',
            priceMonthly: 16,
            features: [
                'Up to 120 pages a month',
                'Unlimited children',
                '30 regenerations / month',
                'Priority queue · faster painting',
                'Hardback discount (€8 off each)',
                'Early access to new art styles',
            ],
            ctaLabel: 'Open the workshop →',
            ctaHref: '/sign-up?plan=family',
        },
    ],
    comparison: {
        groups: [
            {
                title: 'Tales & pages',
                rows: [
                    {
                        feature: 'Pages per month',
                        free: { type: 'text', value: '8' },
                        storyHour: { type: 'text', value: '48' },
                        family: { type: 'text', value: '120' },
                    },
                    {
                        feature: 'Books and comics',
                        free: { type: 'text', value: 'Books only' },
                        storyHour: { type: 'check' },
                        family: { type: 'check' },
                    },
                    {
                        feature: 'Children supported',
                        free: { type: 'text', value: '1' },
                        storyHour: { type: 'text', value: '3' },
                        family: { type: 'text', value: 'Unlimited' },
                    },
                    {
                        feature: 'Page regenerations',
                        free: { type: 'dash' },
                        storyHour: { type: 'text', value: '10 / mo' },
                        family: { type: 'text', value: '30 / mo' },
                    },
                ],
            },
            {
                title: 'Delivery',
                rows: [
                    {
                        feature: 'Watermark',
                        free: { type: 'text', value: 'On every page' },
                        storyHour: { type: 'text', value: 'None' },
                        family: { type: 'text', value: 'None' },
                    },
                    {
                        feature: 'Print-ready PDF',
                        free: { type: 'dash' },
                        storyHour: { type: 'check' },
                        family: { type: 'check' },
                    },
                    {
                        feature: 'Priority queue',
                        free: { type: 'dash' },
                        storyHour: { type: 'dash' },
                        family: { type: 'check' },
                    },
                    {
                        feature: 'Hardback discount',
                        free: { type: 'dash' },
                        storyHour: { type: 'dash' },
                        family: { type: 'text', value: '€8 off' },
                    },
                ],
            },
            {
                title: 'Workshop',
                rows: [
                    {
                        feature: 'Art styles',
                        free: { type: 'text', value: '6 starters' },
                        storyHour: { type: 'text', value: 'All 19' },
                        family: { type: 'text', value: 'All 19 + early access' },
                    },
                    {
                        feature: 'Stories retained',
                        free: { type: 'text', value: '30 days' },
                        storyHour: { type: 'text', value: 'Forever' },
                        family: { type: 'text', value: 'Forever' },
                    },
                    {
                        feature: 'EN + RU content',
                        free: { type: 'check' },
                        storyHour: { type: 'check' },
                        family: { type: 'check' },
                    },
                ],
            },
        ],
    },
    faq: [
        {
            q: 'Can I cancel any time?',
            a: 'Yes — at the click of a button. Your finished stories stay in your library forever, even after cancelling.',
        },
        {
            q: "What if I don't use my credits?",
            a: "Unused credits roll one month forward, then expire. We won't charge for what you didn't use.",
        },
        {
            q: 'Is the content safe for my child?',
            a: 'Every tale is filtered through layered text and image moderation before delivery. We are strict — child-friendly only.',
        },
        {
            q: "Do you keep my child's data?",
            a: "Only what's needed to make the tales. Names and photos never leave your account. Full export and deletion any time.",
        },
        {
            q: 'Can I gift a tale?',
            a: 'You can. Story Hour comes with one giftable tale a month — perfect for nieces, nephews, and small friends.',
        },
        {
            q: 'What languages?',
            a: 'English and Russian today. French, Spanish, German and Estonian arriving by autumn.',
        },
    ],
};

export default function PricingPage(): React.ReactElement {
    return (
        <>
            <PricingHero />
            <PlansSection plans={PRICING_DATA.plans} />
            <ComparisonTable groups={PRICING_DATA.comparison.groups} />
            <FaqSection items={PRICING_DATA.faq} />
            <CtaSection />
        </>
    );
}
