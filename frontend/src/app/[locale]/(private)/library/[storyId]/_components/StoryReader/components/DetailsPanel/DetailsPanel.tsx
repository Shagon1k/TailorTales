'use client';

import { useTranslations } from 'next-intl';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import { getAge } from '@/utils/date.utils';
import type { IStoryDetail } from '@/types/story.types';
import { LANGUAGES } from '@/constants/languages';
import PdfFileSize from './components/PdfFileSize/PdfFileSize';
import styles from './DetailsPanel.module.scss';

export interface IDetailsPanelProps {
    story: IStoryDetail;
}

export default function DetailsPanel({ story }: Readonly<IDetailsPanelProps>): React.ReactElement {
    const t = useTranslations('storyReader.details');
    const age = getAge(story.child.birthdate);
    const createdDate = new Date(story.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const rows: { label: string; value: React.ReactNode }[] = [
        { label: t('labels.created'), value: createdDate },
        { label: t('labels.reader'), value: `${story.child.name}, age ${age}` },
        {
            label: t('labels.format'),
            value:
                story.type === 'BOOK'
                    ? t('format.book')
                    : story.type === 'COMIC'
                      ? t('format.comic')
                      : story.type,
        },
        { label: t('labels.style'), value: story.artStyle.name },
        {
            label: t('labels.language'),
            value: LANGUAGES[story.language]?.nativeName ?? story.language,
        },
        {
            label: t('labels.fileSize'),
            value: story.pdfUrl ? <PdfFileSize url={story.pdfUrl} /> : '—',
        },
    ];

    return (
        <section className={styles.details} aria-labelledby="details-heading">
            <div className={styles.details__header}>
                <CapsLabel variant="gold">{t('eyebrow')}</CapsLabel>
            </div>

            <dl className={styles.details__list}>
                {rows.map(({ label, value }) => (
                    <div key={label} className={styles.details__row}>
                        <dt className={styles['details__row-label']}>{label}</dt>
                        <dd className={styles['details__row-value']}>{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
