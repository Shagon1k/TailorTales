import { Fragment } from 'react';
import type { IComparisonGroup, TComparisonCellValue } from '../types';
import styles from './ComparisonTable.module.scss';

interface IComparisonTableProps {
    groups: IComparisonGroup[];
}

function Cell({ value }: Readonly<{ value: TComparisonCellValue }>): React.ReactElement {
    if (value.type === 'check') return <span className={styles.table__check} aria-label="Included">✓</span>;
    if (value.type === 'dash') return <span className={styles.table__dash} aria-label="Not included">—</span>;
    return <span>{value.value}</span>;
}

export default function ComparisonTable({ groups }: Readonly<IComparisonTableProps>): React.ReactElement {
    return (
        <section className={styles.section}>
            <h2 className={styles.section__heading}>What&apos;s in each tea?</h2>
            <div className={styles.section__wrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles['table__th-feature']}>Feature</th>
                            <th className={styles.table__th}>Free</th>
                            <th className={styles['table__th--accent']}>Story Hour</th>
                            <th className={styles.table__th}>Family</th>
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
                                        <td className={styles['table__td-feature']}>{row.feature}</td>
                                        <td className={styles.table__td}><Cell value={row.free} /></td>
                                        <td className={styles['table__td--accent']}><Cell value={row.storyHour} /></td>
                                        <td className={styles.table__td}><Cell value={row.family} /></td>
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
