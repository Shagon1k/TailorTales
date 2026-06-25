'use client';

import { useTranslations } from 'next-intl';
import { Stack } from '@mantine/core';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Link from '@/components/ui/Link/Link';
import Loader from '@/components/ui/Loader/Loader';
import { useInvoices } from '@/hooks/subscription';
import { formatLongDate } from '@/utils/date.utils';
import { formatMoney } from '@/utils/money.utils';
import styles from './InvoiceList.module.scss';

interface IInvoiceListProps {
    isPaid: boolean;
}

export default function InvoiceList({ isPaid }: Readonly<IInvoiceListProps>): React.ReactElement {
    const t = useTranslations('account.subscription.invoices');
    const { data: invoices, isLoading } = useInvoices();

    return (
        <Card variant="gradient" size="md">
            <Stack gap="sm">
                <CapsLabel>{t('eyebrow')}</CapsLabel>

                {isLoading ? (
                    <Loader size="sm" label={t('loading')} />
                ) : !invoices || invoices.length === 0 ? (
                    <p className={styles['invoice-list__empty']}>
                        {isPaid ? t('emptyPaid') : t('emptyFree')}
                    </p>
                ) : (
                    <ul className={styles['invoice-list__items']}>
                        {invoices.map((invoice) => (
                            <li
                                key={`${invoice.date}-${invoice.amount}`}
                                className={styles['invoice-list__item']}
                            >
                                <span className={styles['invoice-list__date']}>
                                    {formatLongDate(invoice.date)}
                                </span>
                                <span className={styles['invoice-list__description']}>
                                    {invoice.description}
                                </span>
                                <span className={styles['invoice-list__amount']}>
                                    {formatMoney(invoice.amount, invoice.currency)}
                                </span>
                                <span className={styles['invoice-list__status']}>
                                    {invoice.status}
                                </span>
                                {invoice.invoicePdfUrl && (
                                    <Link href={invoice.invoicePdfUrl} variant="quiet">
                                        {t('pdfLink')}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Stack>
        </Card>
    );
}
