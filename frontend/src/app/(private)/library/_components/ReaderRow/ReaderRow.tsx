import Link from 'next/link';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import type { IChild } from '@/types/child.types';
import type { IStorySummary } from '@/types/story.types';
import ReaderCard from './components/ReaderCard/ReaderCard';
import styles from './ReaderRow.module.scss';

export interface IReaderRowProps {
    readers: IChild[];
    stories: IStorySummary[];
}

export default function ReaderRow({
    readers,
    stories,
}: Readonly<IReaderRowProps>): React.ReactElement {
    return (
        <section className={styles['reader-row']} aria-labelledby="readers-heading">
            <div className={styles['reader-row__header']}>
                <h2 id="readers-heading" className={styles['reader-row__title']}>
                    Your readers
                </h2>
                <Link href="/account/children" className={styles['reader-row__manage']}>
                    <CapsLabel>Manage children →</CapsLabel>
                </Link>
            </div>

            <div className={styles['reader-row__track']} role="list" aria-label="Readers">
                {readers.map((child) => (
                    <div key={child.id} role="listitem">
                        <ReaderCard child={child} stories={stories} />
                    </div>
                ))}

                <div role="listitem" className={styles['reader-row__add']}>
                    <Link href="/account/children" className={styles['reader-row__add-link']}>
                        <span className={styles['reader-row__add-icon']} aria-hidden="true">
                            +
                        </span>
                        <span className={styles['reader-row__add-label']}>
                            Add another little reader
                        </span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
