'use client';

import { useActionState } from 'react';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import Button from '@/components/ui/Button/Button';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import { submitContact, type TContactFormState } from '../actions';
import styles from './ContactForm.module.scss';

const INITIAL_STATE: TContactFormState = { status: 'idle' };

export default function ContactForm(): React.ReactElement {
    const [state, formAction, isPending] = useActionState(submitContact, INITIAL_STATE);

    if (state.status === 'success') {
        return (
            <div className={styles.success}>
                <p className={styles.success__heading}>Message sent.</p>
                <p className={styles.success__body}>
                    We read every one. We&apos;ll write back soon.
                </p>
            </div>
        );
    }

    return (
        <form action={formAction} noValidate className={styles.form}>
            <div className={styles['form__name-field']}>
                <div className={styles['form__name-mascot']} aria-hidden="true">
                    <MascotImage image="fox-mail" size={130} glow="outline" />
                </div>
                <Input name="name" label="Your name" placeholder="Ada" required />
            </div>
            <Input
                name="email"
                type="email"
                label="Your email"
                placeholder="ada@example.com"
                required
            />
            <Textarea
                name="message"
                label="Message"
                placeholder="What's on your mind?"
                required
                minRows={5}
            />
            {state.status === 'error' && (
                <p className={styles.error} role="alert">
                    {state.message}
                </p>
            )}
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
                {isPending ? 'Sending…' : 'Send message →'}
            </Button>
        </form>
    );
}
