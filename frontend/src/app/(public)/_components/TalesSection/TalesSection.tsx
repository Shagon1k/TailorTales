import CapsLink from '@/components/ui/CapsLink/CapsLink';
import StoryCard from './components/StoryCard/StoryCard';
import styles from './TalesSection.module.scss';

// TODO: Replace MOCK_TALES with real data from GET /stories?featured=true once
// the backend stories endpoint is wired. Show this section only when
// at least one published story exists (condition: stories.length > 0).

const MOCK_TALES = [
    {
        id: '1',
        quote: 'Why does the moon follow me home?',
        childName: 'Lila',
        age: 5,
        pages: 12,
        format: 'book' as const,
        rating: 5,
        tone: 'rose' as const,
    },
    {
        id: '2',
        quote: 'How do bees know which flower is mine?',
        childName: 'Otis',
        age: 4,
        pages: 8,
        format: 'book' as const,
        rating: 5,
        tone: 'fox' as const,
    },
    {
        id: '3',
        quote: 'Where does the river end?',
        childName: 'Sasha',
        age: 8,
        pages: 16,
        format: 'comic' as const,
        rating: 4,
        tone: 'plum' as const,
    },
] as const;

export default function TalesSection(): React.ReactElement {
    return (
        <section className={styles.tales}>
            <div className={styles.tales__inner}>
                <div className={styles.tales__header}>
                    <h2 className={styles.tales__heading}>Tales lit this week.</h2>
                    {/* TODO: link to /tales once the public library page is built */}
                    <CapsLink href="#">Browse the library →</CapsLink>
                </div>
                <div className={styles.tales__grid}>
                    {MOCK_TALES.map((tale) => (
                        <StoryCard key={tale.id} {...tale} />
                    ))}
                </div>
            </div>
        </section>
    );
}
