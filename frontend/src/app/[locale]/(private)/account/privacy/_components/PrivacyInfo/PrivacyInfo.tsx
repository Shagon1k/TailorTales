import { Stack } from '@mantine/core';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import styles from './PrivacyInfo.module.scss';

// Placeholder copy — final wording lands in the pre-launch content pass
// (ROADMAP Deferred Decision #5). The structure (what / why / who / how long /
// your rights) is the GDPR-required information surface.
const SECTIONS: Array<{ title: string; body: string }> = [
    {
        title: 'What we collect',
        body: 'Your Google account basics (name, email, avatar), the child profiles you create (name, birthdate, interests), character descriptions, and the stories we generate for you. We never ask for, or store, payment card details.',
    },
    {
        title: 'Why we process it',
        body: 'Solely to create and deliver your personalized stories, run your subscription, and notify you when tales are ready. No advertising, no profiling, no selling data.',
    },
    {
        title: 'Who helps us (sub-processors)',
        body: 'Paddle (payments & billing), OpenRouter (story text and illustration generation), Resend (email delivery), and our cloud storage provider (generated PDFs and images). Each receives only what their job requires.',
    },
    {
        title: 'How long we keep it',
        body: 'Your account data stays while the account exists. Generated story files follow your plan’s retention period — Free Chapter PDFs and images are removed 30 days after creation; paid-tier stories are kept while you subscribe.',
    },
    {
        title: 'Your rights',
        body: 'Export everything we hold about you as JSON below, or delete your account — including every generated file — at any time. Questions? Reach us via the contact page.',
    },
];

export default function PrivacyInfo(): React.ReactElement {
    return (
        <Card variant="gradient" size="md">
            <Stack gap="md">
                <CapsLabel>Privacy & data</CapsLabel>
                {SECTIONS.map((section) => (
                    <div key={section.title}>
                        <h3 className={styles['privacy-info__title']}>{section.title}</h3>
                        <p className={styles['privacy-info__body']}>{section.body}</p>
                    </div>
                ))}
            </Stack>
        </Card>
    );
}
