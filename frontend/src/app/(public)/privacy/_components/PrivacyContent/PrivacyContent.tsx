// TODO: If the legal team needs to update this copy without a code deploy,
//       extract these sections to a CMS (e.g. Notion, Contentful) and fetch
//       server-side. For now, static copy is the right tradeoff.
import styles from './PrivacyContent.module.scss';

const SECTIONS = [
    {
        title: 'What we collect',
        body: 'We collect your email address, the first name and age of each child profile you create, and the tale preferences you choose (themes, art style, format). We also collect standard server logs (IP address, browser type) for security and debugging. Nothing else.',
    },
    {
        title: 'How we use it',
        body: "Your child's name and age are used only to personalise the tale you requested — they are never used for advertising, profiling, or shared with third parties. Your email is used to deliver tales and, if you opt in, to send occasional updates about new features. You can unsubscribe at any time.",
    },
    {
        title: 'Who we share it with',
        body: 'We use a small number of trusted sub-processors to operate the service: a cloud hosting provider, a payment processor (for paid plans), and an AI image generation service. Each receives only the minimum data needed. We do not sell, rent, or trade your data. Ever.',
    },
    {
        title: 'Your rights',
        body: 'You can export all your data or delete your account at any time from Account → Privacy. Deletion is permanent and processed within 30 days. If you have a question or concern, email us at hello@tailortales.app and we will respond within 5 business days.',
    },
    {
        title: 'Cookies',
        body: 'We use one first-party session cookie to keep you signed in, and one cookie to remember your preferences (language, theme). We do not use tracking cookies or third-party advertising cookies.',
    },
] as const;

export default function PrivacyContent(): React.ReactElement {
    return (
        <article className={styles.content}>
            {SECTIONS.map(({ title, body }) => (
                <section key={title} className={styles.section}>
                    <h2 className={styles.section__title}>{title}</h2>
                    <p className={styles.section__body}>{body}</p>
                </section>
            ))}
            <p className={styles.content__updated}>Last updated: May 2026.</p>
        </article>
    );
}
