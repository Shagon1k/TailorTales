import Link from 'next/link';
import styles from './Footer.module.scss';

export default function Footer(): React.ReactElement {
    return (
        <footer className={styles.footer}>
            <div className={styles.footer__inner}>
                <div className={styles.footer__brand}>
                    <Link href="/" className={styles.footer__wordmark}>
                        TailorTales
                    </Link>
                    <p className={styles.footer__tagline}>
                        A small workshop for one child&apos;s questions.
                    </p>
                </div>
                <nav className={styles.footer__links} aria-label="Footer navigation">
                    <Link href="/how-it-works" className={styles.footer__link}>
                        How it works
                    </Link>
                    <span className={styles.footer__separator} aria-hidden="true">
                        ·
                    </span>
                    <Link href="/privacy" className={styles.footer__link}>
                        Privacy
                    </Link>
                    <span className={styles.footer__separator} aria-hidden="true">
                        ·
                    </span>
                    <Link href="/contact" className={styles.footer__link}>
                        Contact
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
