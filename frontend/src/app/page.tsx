import { Container, Title, Text, Button, Stack } from '@mantine/core';
import Tag from '@/components/Tag/Tag';

export default function HomePage(): React.ReactElement {
    return (
        <Container size="sm" py="xl">
            <Stack align="center" gap="lg">
                <Tag>AI-powered</Tag>
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
