import Link from 'next/link';
import BlueprintForm from '../_components/BlueprintForm/BlueprintForm';
import styles from './page.module.scss';

export default function NewBlueprintPage(): React.ReactElement {
    return (
        <div className={styles.page}>
            <nav aria-label="Breadcrumb" className={styles.page__breadcrumb}>
                <Link href="/admin/blueprints" className={styles.page__back}>
                    ← Blueprints
                </Link>
            </nav>
            <h1 className={styles.page__title}>New blueprint</h1>
            <BlueprintForm />
        </div>
    );
}
