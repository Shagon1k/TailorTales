import type { IFaqItem } from '../_components/types';

export const PLAN_COPY: Record<string, { tagline: string; ctaLabel: string; mostLoved?: boolean }> =
    {
        'Free Chapter': { tagline: 'A first tale, free.', ctaLabel: 'Begin free →' },
        'Story Hour': {
            tagline: 'The cosy bedtime bundle.',
            ctaLabel: 'Join Story Hour →',
            mostLoved: true,
        },
        'Family Workshop': {
            tagline: 'For voracious little readers.',
            ctaLabel: 'Open the workshop →',
        },
    };

export const FAQ: IFaqItem[] = [
    {
        q: 'Can I cancel any time?',
        a: 'Yes — at the click of a button. You keep your plan until the end of the period you paid for, and your finished stories stay in your library.',
    },
    {
        q: "What if I don't use my credits?",
        a: 'Unused credits expire at the end of each billing month — your full allowance returns with every new cycle.',
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
        a: 'Yes. Both paid plans let you share finished tales — perfect for nieces, nephews, and small friends.',
    },
    {
        q: 'What languages?',
        a: 'English and Russian today. French, Spanish, German and Estonian arriving by autumn.',
    },
];
