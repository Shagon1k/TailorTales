import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import CapsLink from '@/components/ui/CapsLink/CapsLink';
import type { IChild } from '@/types/child.types';
import type { IStorySummary } from '@/types/story.types';
import ReaderCard from './components/ReaderCard/ReaderCard';
import styles from './ReaderRow.module.scss';

export interface IReaderRowProps {
    readers: IChild[];
    stories: IStorySummary[];
}

export default async function ReaderRow({
    readers,
    stories,
}: Readonly<IReaderRowProps>): Promise<React.ReactElement> {
    const t = await getTranslations('library.readers');

    return (
        <section className={styles['reader-row']} aria-labelledby="readers-heading">
            <div className={styles['reader-row__header']}>
                <h2 id="readers-heading" className={styles['reader-row__title']}>
                    {t('heading')}
                </h2>
                <CapsLink href="/account/children">{t('manageLink')}</CapsLink>
            </div>

            <div className={styles['reader-row__track']} role="list" aria-label={t('ariaLabel')}>
                {readers.map((child) => (
                    <div key={child.id} role="listitem">
                        <ReaderCard child={child} stories={stories} />
                    </div>
                ))}

                <div role="listitem" className={styles['reader-row__add']}>
                    <Link href="/account/children" className={styles['reader-row__add-link']}>
                        <span className={styles['reader-row__add-icon']} aria-hidden="true">
                            <span className={styles['reader-row__add-plus']}>
                                <svg
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M6 2.5v7M2.5 6h7"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                        </span>
                        <span className={styles['reader-row__add-label']}>{t('addLabel')}</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
