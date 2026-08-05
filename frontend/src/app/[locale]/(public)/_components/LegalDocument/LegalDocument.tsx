import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import styles from './LegalDocument.module.scss';

type TDocument = 'privacy' | 'terms';

function LegalSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}): React.ReactElement {
    return (
        <section>
            <h2>{title}</h2>
            {children}
        </section>
    );
}

async function PrivacyNotice(): Promise<React.ReactElement> {
    const t = await getTranslations('privacy.document');

    return (
        <>
            <LegalSection title={t('controller.title')}>
                <p>{t('controller.body')}</p>
            </LegalSection>
            <LegalSection title={t('data.title')}>
                <p>{t('data.collection')}</p>
                <p>{t('data.use')}</p>
            </LegalSection>
            <LegalSection title={t('children.title')}>
                <p>{t('children.details')}</p>
                <p>{t('children.safety')}</p>
            </LegalSection>
            <LegalSection title={t('processors.title')}>
                <p>{t('processors.providers')}</p>
                <p>{t('processors.noSale')}</p>
            </LegalSection>
            <LegalSection title={t('retention.title')}>
                <p>{t('retention.period')}</p>
                <p>
                    {t.rich('retention.accountAction', {
                        accountPrivacy: (chunks) => <Link href="/account/privacy">{chunks}</Link>,
                    })}
                </p>
            </LegalSection>
            <LegalSection title={t('cookies.title')}>
                <p>{t('cookies.body')}</p>
            </LegalSection>
            <LegalSection title={t('rights.title')}>
                <p>{t('rights.body')}</p>
            </LegalSection>
        </>
    );
}

async function TermsOfService(): Promise<React.ReactElement> {
    const t = await getTranslations('terms.document');

    return (
        <>
            <LegalSection title={t('agreement.title')}>
                <p>{t('agreement.body')}</p>
            </LegalSection>
            <LegalSection title={t('service.title')}>
                <p>{t('service.body')}</p>
            </LegalSection>
            <LegalSection title={t('billing.title')}>
                <p>{t('billing.body')}</p>
            </LegalSection>
            <LegalSection title={t('content.title')}>
                <p>{t('content.body')}</p>
            </LegalSection>
            <LegalSection title={t('use.title')}>
                <p>{t('use.body')}</p>
            </LegalSection>
            <LegalSection title={t('liability.title')}>
                <p>{t('liability.body')}</p>
            </LegalSection>
            <LegalSection title={t('law.title')}>
                <p>{t('law.body')}</p>
            </LegalSection>
        </>
    );
}

export default async function LegalDocument({
    document,
}: {
    document: TDocument;
}): Promise<React.ReactElement> {
    const t = await getTranslations(`${document}.document`);
    const isPrivacy = document === 'privacy';

    return (
        <article className={styles.content}>
            <p className={styles.intro}>{t('intro')}</p>
            {isPrivacy ? <PrivacyNotice /> : <TermsOfService />}
            <p className={styles.updated}>{t('lastUpdated')}</p>
            <p className={styles.notice}>{t('legalReviewNotice')}</p>
        </article>
    );
}
