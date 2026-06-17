'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import Button from '@/components/ui/Button/Button';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import { submitContact, type TContactFormState } from '../actions';
import styles from './ContactForm.module.scss';

const INITIAL_STATE: TContactFormState = { status: 'idle' };

export default function ContactForm(): React.ReactElement {
    const [state, formAction, isPending] = useActionState(submitContact, INITIAL_STATE);
    const t = useTranslations('contact.form');

    if (state.status === 'success') {
        return (
            <div className={styles.success}>
                <p className={styles.success__heading}>{t('successHeading')}</p>
                <p className={styles.success__body}>{t('successBody')}</p>
            </div>
        );
    }

    return (
        <form action={formAction} noValidate className={styles.form}>
            <div className={styles['form__name-field']}>
                <div className={styles['form__name-mascot']} aria-hidden="true">
                    <MascotImage image="fox-mail" size={130} glow="outline" />
                </div>
                <Input
                    name="name"
                    label={t('nameLabel')}
                    placeholder={t('namePlaceholder')}
                    required
                />
            </div>
            <Input
                name="email"
                type="email"
                label={t('emailLabel')}
                placeholder={t('emailPlaceholder')}
                required
            />
            <Textarea
                name="message"
                label={t('messageLabel')}
                placeholder={t('messagePlaceholder')}
                required
                minRows={5}
            />
            {state.status === 'error' && (
                <p className={styles.error} role="alert">
                    {state.message}
                </p>
            )}
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
                {isPending ? t('sendingButton') : t('sendButton')}
            </Button>
        </form>
    );
}
