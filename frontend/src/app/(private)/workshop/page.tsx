import PageHero from '@/components/ui/PageHero/PageHero';
import { childrenServerApi } from '@/api/children.server';
import { artStylesServerApi } from '@/api/art-styles.server';
import { storiesServerApi } from '@/api/stories.server';
import WorkshopForm from './_components/WorkshopForm/WorkshopForm';
import styles from './page.module.scss';

interface IWorkshopPageProps {
    searchParams: Promise<{ childId?: string; question?: string }>;
}

export default async function WorkshopPage({
    searchParams,
}: Readonly<IWorkshopPageProps>): Promise<React.ReactElement> {
    const [{ childId, question }, readers, artStyles, config] = await Promise.all([
        searchParams,
        childrenServerApi.getAll(),
        artStylesServerApi.getAll(),
        storiesServerApi.getConfig(),
    ]);

    return (
        <main className={styles.page}>
            <PageHero eyebrow="· THE WORKSHOP ·" heading="Let's make one small tale." />
            <WorkshopForm
                readers={readers}
                artStyles={artStyles}
                config={config}
                initialChildId={childId ?? null}
                initialQuestion={question ?? ''}
            />
        </main>
    );
}
