import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { storiesServerApi } from '@/api/stories.server';

export const metadata: Metadata = { title: 'Story' };
import StoryReader from './_components/StoryReader/StoryReader';

interface IStoryPageProps {
    params: Promise<{ storyId: string }>;
}

export default async function StoryPage({
    params,
}: Readonly<IStoryPageProps>): Promise<React.ReactElement> {
    const { storyId } = await params;
    const story = await storiesServerApi.getOne(storyId);

    // Only completed stories are readable; unfinished stories remain in the workshop flow.
    if (story.status !== 'COMPLETED') {
        redirect('/library');
    }

    return <StoryReader story={story} />;
}
