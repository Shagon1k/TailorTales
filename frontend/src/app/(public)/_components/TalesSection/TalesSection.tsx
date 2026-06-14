import CapsLink from '@/components/ui/CapsLink/CapsLink';
import type { IStorySummary } from '@/types/story.types';
import { getAge } from '@/utils/date.utils';
import StoryCard, { type TStoryCardTone } from './components/StoryCard/StoryCard';
import styles from './TalesSection.module.scss';

// Decorative card accents — cycled by position, not tied to story data.
const TONES: TStoryCardTone[] = ['rose', 'fox', 'plum'];

export interface ITalesSectionProps {
    tales: IStorySummary[];
}

export default function TalesSection({
    tales,
}: Readonly<ITalesSectionProps>): React.ReactElement | null {
    // Show the section only once at least one family has opted a story in.
    if (tales.length === 0) return null;

    return (
        <section className={styles.tales}>
            <div className={styles.tales__inner}>
                <div className={styles.tales__header}>
                    <h2 className={styles.tales__heading}>Tales lit recently.</h2>
                    {/* TODO: link to /tales once the public library page is built */}
                    <CapsLink href="#">Browse the library →</CapsLink>
                </div>
                <div className={styles.tales__grid}>
                    {tales.map((tale, index) => (
                        <StoryCard
                            key={tale.id}
                            quote={tale.question}
                            childName={tale.child.name}
                            age={getAge(tale.child.birthdate)}
                            pages={tale.pageCount}
                            format={tale.type === 'COMIC' ? 'comic' : 'book'}
                            rating={tale.rating ?? 0}
                            tone={TONES[index % TONES.length]}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
