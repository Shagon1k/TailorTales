'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Text, Button } from '@mantine/core';
import { useCurrentUser } from '@/context/UserContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LoginPage(): React.ReactElement {
    const { user } = useCurrentUser();
    const router = useRouter();

    useEffect(() => {
        if (user) router.replace('/profile');
    }, [user, router]);

    return (
        <Container size="xs" py="xl">
            <Stack align="center" gap="lg">
                <Title order={1}>TailorTales</Title>
                <Text c="dimmed" ta="center">
                    Sign in to create your personalized stories
                </Text>
                <Button component="a" href={`${BACKEND_URL}/auth/google`} size="lg" radius="md">
                    Sign in with Google
                </Button>
            </Stack>
        </Container>
    );
}
