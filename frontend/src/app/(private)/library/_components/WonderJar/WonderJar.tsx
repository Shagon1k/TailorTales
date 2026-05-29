import Link from 'next/link';
import type { IChild } from '@/types/child.types';
import styles from './WonderJar.module.scss';

export interface IWonderJarProps {
    readers: IChild[];
    suggestions: string[];
}

export default function WonderJar({
    readers,
    suggestions,
}: Readonly<IWonderJarProps>): React.ReactElement {
    const readerNames = readers.map((r) => r.name);
    const namesPhrase =
        readerNames.length === 0
            ? 'your little reader'
            : readerNames.length === 1
              ? readerNames[0]
              : `${readerNames.slice(0, -1).join(', ')} and ${readerNames[readerNames.length - 1]}`;

    return (
        <section className={styles['wonder-jar']} aria-labelledby="wonder-jar-heading">
            <div className={styles['wonder-jar__intro']}>
                <p className={styles['wonder-jar__eyebrow']}>· From the wonder jar ·</p>
                <h2 id="wonder-jar-heading" className={styles['wonder-jar__heading']}>
                    Some quiet questions for tonight.
                </h2>
                <p className={styles['wonder-jar__sub']}>
                    Picked because {namesPhrase} might love them. Tap one to start a tale.
                </p>
            </div>

            <ul className={styles['wonder-jar__list']} aria-label="Question suggestions">
                {suggestions.map((question) => (
                    <li key={question}>
                        <Link
                            href={`/workshop?question=${encodeURIComponent(question)}`}
                            className={styles['wonder-jar__item']}
                        >
                            <span className={styles['wonder-jar__plus']} aria-hidden="true">
                                +
                            </span>
                            <span>{question}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
