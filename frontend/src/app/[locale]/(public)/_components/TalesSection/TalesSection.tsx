import { getTranslations } from 'next-intl/server';
import type { IPublicStorySummary } from '@/types/story.types';
import StoryCard, { type TStoryCardTone } from './components/StoryCard/StoryCard';
import styles from './TalesSection.module.scss';

// Decorative card accents — cycled by position, not tied to story data.
const TONES: TStoryCardTone[] = ['rose', 'fox', 'plum'];

export interface ITalesSectionProps {
    tales: IPublicStorySummary[];
}

export default async function TalesSection({
    tales,
}: Readonly<ITalesSectionProps>): Promise<React.ReactElement | null> {
    // Show the section only once at least one family has opted a story in.
    if (tales.length === 0) return null;

    const t = await getTranslations('home.tales');

    return (
        <section className={styles.tales}>
            <div className={styles.tales__inner}>
                <div className={styles.tales__header}>
                    <h2 className={styles.tales__heading}>{t('heading')}</h2>
                </div>
                <div className={styles.tales__grid}>
                    {tales.map((tale, index) => (
                        <StoryCard
                            key={tale.id}
                            title={tale.title}
                            quote={tale.question}
                            age={tale.readerAge}
                            pages={tale.pageCount}
                            language={tale.language}
                            genre={tale.genre}
                            writingStyle={tale.writingStyle}
                            artStyleName={tale.artStyle.name}
                            hasCharacter={tale.hasCharacter}
                            pdfUrl={tale.pdfUrl}
                            format={tale.type === 'COMIC' ? 'comic' : 'book'}
                            rating={tale.rating}
                            tone={TONES[index % TONES.length]}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
