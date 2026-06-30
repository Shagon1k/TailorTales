import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { IChild } from '@/types/child.types';
import {
    getLocalizedQuestionSuggestions,
    getRandomQuestionSuggestions,
} from '@/utils/question-suggestions.utils';
import styles from './WonderJar.module.scss';

export interface IWonderJarProps {
    readers: IChild[];
}

export default async function WonderJar({
    readers,
}: Readonly<IWonderJarProps>): Promise<React.ReactElement> {
    const t = await getTranslations('library.wonderJar');
    const tWorkshop = await getTranslations('workshop.form');
    const suggestions = getRandomQuestionSuggestions(
        getLocalizedQuestionSuggestions((key) => tWorkshop(key)),
    );
    const readerNames = readers.map((r) => r.name);
    const namesPhrase =
        readerNames.length === 0
            ? t('namesPhraseNone')
            : readerNames.length === 1
              ? readerNames[0]
              : `${readerNames.slice(0, -1).join(', ')} ${t('namesAnd')} ${readerNames[readerNames.length - 1]}`;

    return (
        <section className={styles['wonder-jar']} aria-labelledby="wonder-jar-heading">
            <div className={styles['wonder-jar__intro']}>
                <p className={styles['wonder-jar__eyebrow']}>{t('eyebrow')}</p>
                <h2 id="wonder-jar-heading" className={styles['wonder-jar__heading']}>
                    {t('heading')}
                </h2>
                <p className={styles['wonder-jar__sub']}>{t('subheading', { namesPhrase })}</p>
            </div>

            <ul className={styles['wonder-jar__list']} aria-label={t('suggestionsAriaLabel')}>
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
