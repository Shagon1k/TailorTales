import type { Metadata } from 'next';
import { getServerUser } from '@/api/user.server';

export const metadata: Metadata = { title: 'Library' };
import { childrenServerApi } from '@/api/children.server';
import { storiesServerApi } from '@/api/stories.server';
import LibraryGreeting from './_components/LibraryGreeting/LibraryGreeting';
import ReaderRow from './_components/ReaderRow/ReaderRow';
import SignupTracker from './_components/SignupTracker/SignupTracker';
import TaleGrid from './_components/TaleGrid/TaleGrid';
import WonderJar from './_components/WonderJar/WonderJar';
import styles from './page.module.scss';

export default async function LibraryPage(): Promise<React.ReactElement> {
    const [user, readers, allStories] = await Promise.all([
        getServerUser(),
        childrenServerApi.getAll(),
        storiesServerApi.getAll(),
    ]);

    const stories = allStories.filter(
        (story) =>
            story.status === 'COMPLETED' || story.status === 'FAILED' || story.status === 'DRAFT',
    );

    return (
        <div className={styles.page}>
            <SignupTracker />
            <LibraryGreeting userName={user?.name ?? null} storyCount={stories.length} />
            <ReaderRow readers={readers} stories={stories} />
            <TaleGrid readers={readers} stories={stories} />
            <WonderJar readers={readers} />
        </div>
    );
}
