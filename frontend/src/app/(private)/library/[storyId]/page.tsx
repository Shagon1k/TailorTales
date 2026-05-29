import { redirect } from 'next/navigation';
import { storiesServerApi } from '@/api/stories.server';
import StoryReader from './_components/StoryReader/StoryReader';

interface IStoryPageProps {
    params: Promise<{ storyId: string }>;
}

export default async function StoryPage({
    params,
}: Readonly<IStoryPageProps>): Promise<React.ReactElement> {
    const { storyId } = await params;
    const story = await storiesServerApi.getOne(storyId);

    // Only COMPLETED stories are readable — others live in the workshop.
    // Phase 5 will redirect to /workshop/[jobId] for in-progress stories.
    if (story.status !== 'COMPLETED') {
        redirect('/library');
    }

    return <StoryReader story={story} />;
}
