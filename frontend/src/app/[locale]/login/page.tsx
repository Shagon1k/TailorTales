import Footer from '@/components/shared/Footer/Footer';
import LoginClientContent from './_components/LoginClientContent/LoginClientContent';
import styles from './page.module.scss';

export default function LoginPage(): React.ReactElement {
    return (
        <div className={styles.page}>
            <LoginClientContent />
            <Footer />
        </div>
    );
}
