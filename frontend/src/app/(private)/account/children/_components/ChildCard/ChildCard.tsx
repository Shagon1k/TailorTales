import { Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import type { IChild } from '@/types/child.types';

interface IChildCardProps {
    child: IChild;
    onEdit: (child: IChild) => void;
    onDelete: (child: IChild) => void;
}

function getAgeLabel(birthdate: string): string {
    const birth = new Date(birthdate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const hasBirthdayPassed =
        now.getMonth() > birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    const age = hasBirthdayPassed ? years : years - 1;
    return age === 0 ? 'Under 1 year' : `${age} year${age === 1 ? '' : 's'} old`;
}

export default function ChildCard({
    child,
    onEdit,
    onDelete,
}: Readonly<IChildCardProps>): React.ReactElement {
    return (
        <Card shadow="sm" padding="md" radius="md" withBorder>
            <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={2}>
                        <Title order={4}>{child.name}</Title>
                        <Text size="sm" c="dimmed">
                            {getAgeLabel(child.birthdate)} ·{' '}
                            {child.gender === 'MALE' ? 'Boy' : 'Girl'}
                        </Text>
                    </Stack>
                    <Group gap="xs">
                        <Button size="xs" variant="subtle" onClick={() => onEdit(child)}>
                            Edit
                        </Button>
                        <Button
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={() => onDelete(child)}
                        >
                            Delete
                        </Button>
                    </Group>
                </Group>

                {child.interests.length > 0 && (
                    <Group gap="xs" wrap="wrap">
                        {child.interests.map((interest) => (
                            <Badge key={interest} variant="light" size="sm">
                                {interest}
                            </Badge>
                        ))}
                    </Group>
                )}
            </Stack>
        </Card>
    );
}
