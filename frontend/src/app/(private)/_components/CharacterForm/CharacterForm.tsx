import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';
import Button from '@/components/ui/Button/Button';
import styles from './CharacterForm.module.scss';

export interface ICharacterFormValues {
    name: string;
    description: string;
}

interface ICharacterFormProps {
    initialValues?: Partial<ICharacterFormValues>;
    onSubmit: (values: ICharacterFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const DEFAULT_VALUES: ICharacterFormValues = {
    name: '',
    description: '',
};

export default function CharacterForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: Readonly<ICharacterFormProps>): React.ReactElement {
    const form = useForm<ICharacterFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validate: {
            name: (v) => (v.trim().length < 1 ? 'Name is required' : null),
            description: (v) => (v.trim().length < 1 ? 'Description is required' : null),
        },
    });

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack gap="sm">
                <Input
                    label="Name"
                    placeholder="e.g. Princess Mia"
                    {...form.getInputProps('name')}
                />
                <Textarea
                    label="Description"
                    placeholder="Describe the character's appearance in detail — hair color, eye color, clothing, distinguishing features…"
                    autosize
                    minRows={4}
                    maxRows={8}
                    {...form.getInputProps('description')}
                />
                <div className={styles.actions}>
                    <Button variant="quiet" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmitting}>
                        Save
                    </Button>
                </div>
            </Stack>
        </form>
    );
}
