'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import Popover from '@/components/ui/Popover/Popover';
import { routing, type ILocale } from '@/i18n/config';
import styles from './LocaleSwitcher.module.scss';

interface ILocaleTriggerProps {
    locale: string;
    opened: boolean;
    ariaLabel: string;
    onClick: () => void;
    ref?: React.Ref<HTMLButtonElement>;
}

function LocaleTrigger({
    locale,
    opened,
    ariaLabel,
    onClick,
    ref,
}: Readonly<ILocaleTriggerProps>): React.ReactElement {
    return (
        <button
            ref={ref}
            type="button"
            className={styles.trigger}
            aria-label={ariaLabel}
            aria-expanded={opened}
            aria-haspopup="menu"
            onClick={onClick}
        >
            {locale.toUpperCase()}
        </button>
    );
}

export default function LocaleSwitcher(): React.ReactElement {
    const t = useTranslations('header.localeSwitcher');
    const locale = useLocale() as ILocale;
    const router = useRouter();
    const pathname = usePathname();
    const [opened, setOpened] = useState(false);

    function switchLocale(next: ILocale): void {
        setOpened(false);
        const navigate = (): void => {
            router.replace(pathname, { locale: next });
        };

        // Snapshots current DOM, runs navigate(), then cross-fades to the new page.
        // startTransition must NOT be nested here — it defers React's commit past
        // the transition window, causing elements to flash outside the animation.
        if ('startViewTransition' in document) {
            (
                document as Document & { startViewTransition: (cb: () => void) => void }
            ).startViewTransition(navigate);
        } else {
            navigate();
        }
    }

    return (
        <Popover
            opened={opened}
            onChange={setOpened}
            maxWidth={200}
            trapFocus
            target={
                <LocaleTrigger
                    locale={locale}
                    opened={opened}
                    ariaLabel={t('ariaLabel')}
                    onClick={() => setOpened((v) => !v)}
                />
            }
        >
            <ul className={styles.list} role="menu" aria-label={t('ariaLabel')}>
                {routing.locales.map((loc) => (
                    <li key={loc} role="none">
                        <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={locale === loc}
                            className={styles.option}
                            data-active={locale === loc}
                            data-autofocus={locale === loc || undefined}
                            onClick={() => switchLocale(loc)}
                        >
                            <span className={styles.option__badge}>{loc.toUpperCase()}</span>
                            <span className={styles.option__name}>{t(loc)}</span>
                            {locale === loc && (
                                <span className={styles.option__dot} aria-hidden="true" />
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </Popover>
    );
}
