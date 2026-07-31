import { redirect } from '@/i18n/navigation';
import PaddlePaymentLink from './_components/PaddlePaymentLink/PaddlePaymentLink';

interface ICheckoutPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CheckoutPage({
    params,
    searchParams,
}: Readonly<ICheckoutPageProps>): Promise<React.ReactElement> {
    const { locale } = await params;
    const transactionId = (await searchParams)._ptxn;
    const hasTransactionId = Array.isArray(transactionId)
        ? transactionId.some(Boolean)
        : Boolean(transactionId);

    if (!hasTransactionId) {
        redirect({ href: '/pricing', locale });
    }

    return <PaddlePaymentLink />;
}
