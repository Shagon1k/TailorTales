import { Fragment } from 'react';
import { getTranslations } from 'next-intl/server';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import type { IComparisonGroup, TComparisonCellValue } from '../types';
import styles from './ComparisonTable.module.scss';

interface IComparisonTableProps {
    groups: IComparisonGroup[];
}

function Cell({
    value,
    includedLabel,
    notIncludedLabel,
}: Readonly<{
    value: TComparisonCellValue;
    includedLabel: string;
    notIncludedLabel: string;
}>): React.ReactElement {
    if (value.type === 'check')
        return (
            <span className={styles.table__check} aria-label={includedLabel}>
                ✓
            </span>
        );
    if (value.type === 'dash')
        return (
            <span className={styles.table__dash} aria-label={notIncludedLabel}>
                —
            </span>
        );
    return <span>{value.value}</span>;
}

export default async function ComparisonTable({
    groups,
}: Readonly<IComparisonTableProps>): Promise<React.ReactElement> {
    const t = await getTranslations('pricing.comparison');
    const includedLabel = t('table.cell.included');
    const notIncludedLabel = t('table.cell.notIncluded');

    return (
        <section className={styles.section}>
            <h2 className={styles.section__heading}>{t('heading')}</h2>
            <div className={styles['section__table-area']}>
                <div className={styles['section__mascot']} aria-hidden="true">
                    <MascotImage image="fox-scales" size={150} glow="outline" flip />
                </div>
                <div className={styles.section__wrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles['table__th-feature']}>
                                    {t('table.header.feature')}
                                </th>
                                <th className={styles.table__th}>{t('table.header.free')}</th>
                                <th className={styles['table__th--accent']}>
                                    {t('table.header.storyHour')}
                                </th>
                                <th className={styles.table__th}>{t('table.header.family')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group) => (
                                <Fragment key={group.title}>
                                    <tr key={group.title} className={styles['table__group-header']}>
                                        <td colSpan={4}>{group.title}</td>
                                    </tr>
                                    {group.rows.map((row) => (
                                        <tr key={row.feature} className={styles.table__row}>
                                            <td className={styles['table__td-feature']}>
                                                {row.feature}
                                            </td>
                                            <td className={styles.table__td}>
                                                <Cell
                                                    value={row.free}
                                                    includedLabel={includedLabel}
                                                    notIncludedLabel={notIncludedLabel}
                                                />
                                            </td>
                                            <td className={styles['table__td--accent']}>
                                                <Cell
                                                    value={row.storyHour}
                                                    includedLabel={includedLabel}
                                                    notIncludedLabel={notIncludedLabel}
                                                />
                                            </td>
                                            <td className={styles.table__td}>
                                                <Cell
                                                    value={row.family}
                                                    includedLabel={includedLabel}
                                                    notIncludedLabel={notIncludedLabel}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
