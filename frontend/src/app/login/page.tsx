'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card/Card';
import BrandMark from '@/components/ui/BrandMark/BrandMark';
import Button from '@/components/ui/Button/Button';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Divider from '@/components/ui/Divider/Divider';
import Link from '@/components/ui/Link/Link';
import { useCurrentUser } from '@/context/UserContext';
import styles from './page.module.scss';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

function GoogleIcon(): React.ReactElement {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z" />
        </svg>
    );
}

export default function LoginPage(): React.ReactElement {
    const { user } = useCurrentUser();
    const router = useRouter();

    useEffect(() => {
        if (user) router.replace('/account');
    }, [user, router]);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <BrandMark />
                <div className={styles['header__cta']}>
                    <span className={styles['header__cta-hint']}>New here?</span>
                    <Link href="/" variant="default">Begin a free tale →</Link>
                </div>
            </header>

            <main className={styles.main}>
                <div className={styles.illustration} aria-hidden="true">
                    <div className={styles['illustration__glow']} />
                    <Image
                        src="/images/fox-hero.webp"
                        alt=""
                        width={480}
                        height={480}
                        className={styles['illustration__img']}
                        priority
                    />
                </div>

                <Card variant="dark" size="hero">
                    <div className={styles['card-content']}>
                        <CapsLabel variant="gold">· Welcome back ·</CapsLabel>

                        <div className={styles['card-head']}>
                            <h1 className={styles['card-heading']}>
                                Step back into the workshop.
                            </h1>
                            <p className={styles['card-sub']}>
                                Sign in to find your library, your children&apos;s profiles,
                                and any tales you began but didn&apos;t finish.
                            </p>
                        </div>

                        <Button
                            component="a"
                            href={`${BACKEND_URL}/auth/google`}
                            variant="on-card"
                            leftSection={<GoogleIcon />}
                        >
                            Continue with Google
                        </Button>

                        <Divider variant="dashed" />

                        <p className={styles.legal}>
                            By continuing you agree to our{' '}
                            <Link href="#" variant="on-card">terms</Link>
                            {' '}and{' '}
                            <Link href="/privacy" variant="on-card">privacy</Link>
                            {' '}policy. We will never sell your child&apos;s data. We promise.
                        </p>
                    </div>
                </Card>
            </main>

            <footer className={styles.footer}>
                <p className={styles['footer__copy']}>© TailorTales · Tallinn 2026</p>
                <nav className={styles['footer__links']} aria-label="Footer navigation">
                    <Link href="/privacy" variant="quiet">Privacy</Link>
                    <Link href="#" variant="quiet">Terms</Link>
                    <Link href="#" variant="quiet">Safety for kids</Link>
                </nav>
            </footer>
        </div>
    );
}
