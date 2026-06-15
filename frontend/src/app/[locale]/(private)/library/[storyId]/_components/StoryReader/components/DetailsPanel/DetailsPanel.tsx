import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import { getAge } from '@/utils/date.utils';
import type { IStoryDetail } from '@/types/story.types';
import { LANGUAGES } from '@/constants/languages';
import PdfFileSize from './components/PdfFileSize/PdfFileSize';
import styles from './DetailsPanel.module.scss';

const FORMAT_LABELS: Record<string, string> = {
    BOOK: 'Book',
    COMIC: 'Comic',
};

export interface IDetailsPanelProps {
    story: IStoryDetail;
}

export default function DetailsPanel({ story }: Readonly<IDetailsPanelProps>): React.ReactElement {
    const age = getAge(story.child.birthdate);
    const createdDate = new Date(story.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const rows: { label: string; value: React.ReactNode }[] = [
        { label: 'Created', value: createdDate },
        { label: 'Reader', value: `${story.child.name}, age ${age}` },
        { label: 'Format', value: FORMAT_LABELS[story.type] ?? story.type },
        { label: 'Style', value: story.artStyle.name },
        { label: 'Language', value: LANGUAGES[story.language]?.nativeName ?? story.language },
        {
            label: 'File size',
            value: story.pdfUrl ? <PdfFileSize url={story.pdfUrl} /> : '—',
        },
    ];

    return (
        <section className={styles.details} aria-labelledby="details-heading">
            <div className={styles.details__header}>
                <CapsLabel>· Details ·</CapsLabel>
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
