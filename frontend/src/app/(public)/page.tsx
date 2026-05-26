import { Container, Title, Text, Button, Stack } from '@mantine/core';
import Badge from '@/components/ui/Badge/Badge';

export default function HomePage(): React.ReactElement {
    return (
        <Container size="sm" py="xl">
            <Stack align="center" gap="lg">
                <Badge>AI-powered</Badge>
                <Title order={1}>TailorTales</Title>
                <Text size="lg" c="dimmed" ta="center">
                    Personalized AI-generated storybooks &amp; comics for curious kids.
                </Text>
                <Button size="lg" radius="md">
                    Get started
                </Button>
            </Stack>
        </Container>
    );
}
