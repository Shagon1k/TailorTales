import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import Input from '@/components/ui/Input/Input';
import Select from '@/components/ui/Select/Select';
import TagsInput from '@/components/ui/TagsInput/TagsInput';
import Button from '@/components/ui/Button/Button';
import type { IGender } from '@/types/child.types';
import styles from './ChildForm.module.scss';

export interface IChildFormValues {
    name: string;
    birthdate: string;
    gender: IGender;
    interests: string[];
}

interface IChildFormProps {
    initialValues?: Partial<IChildFormValues>;
    onSubmit: (values: IChildFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const GENDER_OPTIONS = [
    { value: 'MALE', label: 'Boy' },
    { value: 'FEMALE', label: 'Girl' },
];

const TODAY = new Date().toISOString().split('T')[0];

const DEFAULT_VALUES: IChildFormValues = {
    name: '',
    birthdate: '',
    gender: 'MALE',
    interests: [],
};

export default function ChildForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: Readonly<IChildFormProps>): React.ReactElement {
    const form = useForm<IChildFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validate: {
            name: (v) => (v.trim().length < 1 ? 'Name is required' : null),
            birthdate: (v) => {
                if (!v) return 'Birthdate is required';
                const date = new Date(v);
                if (Number.isNaN(date.getTime())) return 'Invalid date';
                if (date > new Date()) return 'Birthdate must be in the past';
                return null;
            },
            gender: (v) => (v ? null : 'Gender is required'),
        },
    });

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack gap="sm">
                <Input label="Name" placeholder="Child's name" {...form.getInputProps('name')} />
                <Input
                    label="Birthdate"
                    type="date"
                    max={TODAY}
                    {...form.getInputProps('birthdate')}
                />
                <Select label="Gender" data={GENDER_OPTIONS} {...form.getInputProps('gender')} />
                <TagsInput
                    label="Interests"
                    placeholder="Add interest and press Enter"
                    {...form.getInputProps('interests')}
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
