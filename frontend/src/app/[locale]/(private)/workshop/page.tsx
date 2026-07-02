import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import PageHero from '@/components/shared/PageHero/PageHero';
import { childrenServerApi } from '@/api/children.server';
import { artStylesServerApi } from '@/api/art-styles.server';
import { storiesServerApi } from '@/api/stories.server';
import WorkshopForm from './_components/WorkshopForm/WorkshopForm';
import styles from './page.module.scss';

interface IWorkshopPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ childId?: string; question?: string; storyId?: string }>;
}

export async function generateMetadata({
    params,
}: Readonly<Pick<IWorkshopPageProps, 'params'>>): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'workshop.page' });

    return { title: t('title') };
}

export default async function WorkshopPage({
    params,
    searchParams,
}: Readonly<IWorkshopPageProps>): Promise<React.ReactElement> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'workshop.hero' });
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
            <PageHero eyebrow={t('eyebrow')} heading={t('heading')} />
            <WorkshopForm
                readers={readers}
                artStyles={artStyles}
                config={config}
                initialStoryId={
                    prefillStory?.status === 'FAILED' || prefillStory?.status === 'DRAFT'
                        ? prefillStory.id
                        : null
                }
                initialChildId={prefillStory?.childId ?? childId ?? null}
                initialCharacterId={prefillStory?.characterId ?? null}
                initialQuestion={prefillStory?.question ?? question ?? ''}
                initialStoryType={prefillStory?.type ?? null}
                initialPageCount={prefillStory?.pageCount ?? null}
                initialArtStyleId={prefillStory?.artStyleId ?? null}
                initialLanguage={prefillStory?.language ?? null}
                initialGenre={prefillStory?.genre ?? null}
                initialWritingStyle={prefillStory ? prefillStory.writingStyle : 'SIMPLE'}
            />
        </main>
    );
}
