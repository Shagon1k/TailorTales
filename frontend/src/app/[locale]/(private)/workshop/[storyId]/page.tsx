import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'In the Workshop' };
import { storiesServerApi } from '@/api/stories.server';
import WorkshopProgress from './_components/WorkshopProgress/WorkshopProgress';

interface IWorkshopProgressPageProps {
    params: Promise<{ storyId: string }>;
}

export default async function WorkshopProgressPage({
    params,
}: Readonly<IWorkshopProgressPageProps>): Promise<React.ReactElement> {
    const { storyId } = await params;

    const story = await storiesServerApi.getOne(storyId);

    // A user landing here on a completed story (bookmark, back button, manual URL)
    // belongs in the library, not the workshop.
    if (story.status === 'COMPLETED') redirect(`/library/${storyId}`);

    return <WorkshopProgress story={story} />;
}
