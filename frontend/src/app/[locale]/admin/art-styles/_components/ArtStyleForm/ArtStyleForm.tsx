import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Textarea from '@/components/ui/Textarea/Textarea';

export interface IArtStyleFormValues {
    name: string;
    slug: string;
    promptPrefix: string;
}

interface IArtStyleFormProps {
    initialValues?: Partial<IArtStyleFormValues>;
    onSubmit: (values: IArtStyleFormValues) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DEFAULT_VALUES: IArtStyleFormValues = {
    name: '',
    slug: '',
    promptPrefix: '',
};

export default function ArtStyleForm({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: Readonly<IArtStyleFormProps>): React.ReactElement {
    const form = useForm<IArtStyleFormValues>({
        initialValues: { ...DEFAULT_VALUES, ...initialValues },
        validate: {
            name: (v) => (v.trim().length < 1 ? 'Name is required' : null),
            slug: (v) => {
                if (!v.trim()) return 'Slug is required';
                if (!SLUG_PATTERN.test(v)) return 'Slug must be kebab-case (e.g. watercolor)';
                return null;
            },
            promptPrefix: (v) => (v.trim().length < 1 ? 'Prompt prefix is required' : null),
        },
    });

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack gap="md">
                <Input label="Name" placeholder="Watercolor" {...form.getInputProps('name')} />
                <Input
                    label="Slug"
                    placeholder="watercolor"
                    description="Lowercase, hyphen-separated (e.g. watercolor-style)"
                    {...form.getInputProps('slug')}
                />
                <Textarea
                    label="Prompt prefix"
                    placeholder="in a soft watercolor style with..."
                    description="Prepended to every story generation prompt"
                    rows={4}
                    {...form.getInputProps('promptPrefix')}
                />
                <Stack gap="xs" align="flex-end">
                    <Button variant="secondary" type="button" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={isSubmitting}>
                        Save
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
}
