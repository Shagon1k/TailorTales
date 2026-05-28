import { getServerUser } from '@/api/user.server';
import { childrenServerApi } from '@/api/children.server';
import { storiesServerApi } from '@/api/stories.server';
import LibraryGreeting from './_components/LibraryGreeting/LibraryGreeting';
import ReaderRow from './_components/ReaderRow/ReaderRow';
import TaleGrid from './_components/TaleGrid/TaleGrid';
import WonderJar from './_components/WonderJar/WonderJar';
import styles from './page.module.scss';

export default async function LibraryPage(): Promise<React.ReactElement> {
    const [user, readers, stories, config] = await Promise.all([
        getServerUser(),
        childrenServerApi.getAll(),
        storiesServerApi.getAll(),
        storiesServerApi.getConfig(),
    ]);

    return (
        <div className={styles.page}>
            <LibraryGreeting userName={user?.name ?? null} storyCount={stories.length} />
            <ReaderRow readers={readers} stories={stories} />
            <TaleGrid readers={readers} stories={stories} />
            <WonderJar readers={readers} suggestions={config.questionSuggestions} />
        </div>
    );
}
