import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import BlueprintForm from '../_components/BlueprintForm/BlueprintForm';
import styles from './page.module.scss';

export const metadata: Metadata = { title: 'New Blueprint' };

export default function NewBlueprintPage(): React.ReactElement {
    return (
        <div className={styles.page}>
            <Link href="/admin/blueprints" className={styles.page__back}>
                ← Blueprints
            </Link>
            <h2 className={styles.page__title}>New blueprint</h2>
            <BlueprintForm />
        </div>
    );
}
