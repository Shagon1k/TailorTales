import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Workshop' };
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import { childrenServerApi } from '@/api/children.server';
import { artStylesServerApi } from '@/api/art-styles.server';
import { storiesServerApi } from '@/api/stories.server';
import WorkshopForm from './_components/WorkshopForm/WorkshopForm';
import styles from './page.module.scss';

interface IWorkshopPageProps {
    searchParams: Promise<{ childId?: string; question?: string; storyId?: string }>;
}

export default async function WorkshopPage({
    searchParams,
}: Readonly<IWorkshopPageProps>): Promise<React.ReactElement> {
    const activeJob = await storiesServerApi.getActiveJob();
    if (activeJob) {
        redirect(`/workshop/${activeJob.storyId}`);
    }

    const [{ childId, question, storyId }, readers, artStyles, config] = await Promise.all([
        searchParams,
        childrenServerApi.getAll(),
        artStylesServerApi.getAll(),
        storiesServerApi.getConfig(),
    ]);

    let prefillStory: Awaited<ReturnType<typeof storiesServerApi.getOne>> | null = null;
    if (storyId) {
        try {
            prefillStory = await storiesServerApi.getOne(storyId);
        } catch (err) {
            console.error('Failed to load story for pre-fill, showing blank form:', err);
        }
    }

    return (
        <main className={styles.page}>
            <PageHero
                eyebrow="The workshop"
                heading={
                    <>
                        Let&apos;s make one <HeroHighlight>small tale</HeroHighlight>.
                    </>
                }
            />
            <WorkshopForm
                readers={readers}
                artStyles={artStyles}
                config={config}
                initialChildId={prefillStory?.childId ?? childId ?? null}
                initialQuestion={prefillStory?.question ?? question ?? ''}
                initialStoryType={prefillStory?.type ?? null}
                initialPageCount={prefillStory?.pageCount ?? null}
                initialArtStyleId={prefillStory?.artStyleId ?? null}
                initialLanguage={prefillStory?.language ?? null}
            />
        </main>
    );
}
