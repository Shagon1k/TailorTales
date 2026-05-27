import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ART_STYLES = [
    {
        name: 'Storybook',
        slug: 'storybook',
        thumbnailUrl: '/images/art-styles/storybook.webp',
        promptPrefix: 'Classic children\'s storybook illustration, warm colours, soft outlines, detailed backgrounds,',
        isActive: true,
        order: 1,
    },
    {
        name: 'Watercolour',
        slug: 'watercolour',
        thumbnailUrl: '/images/art-styles/watercolour.webp',
        promptPrefix: 'Delicate watercolour painting, translucent washes, soft edges, gentle pastel palette,',
        isActive: true,
        order: 2,
    },
    {
        name: 'Crayon',
        slug: 'crayon',
        thumbnailUrl: '/images/art-styles/crayon.webp',
        promptPrefix: 'Colourful crayon drawing, hand-drawn look, visible texture, childlike strokes,',
        isActive: true,
        order: 3,
    },
    {
        name: 'Ink Line',
        slug: 'ink-line',
        thumbnailUrl: '/images/art-styles/ink-line.webp',
        promptPrefix: 'Clean ink line illustration, black outlines, flat colour fills, graphic novel style,',
        isActive: true,
        order: 4,
    },
    {
        name: 'Felt-pen',
        slug: 'felt-pen',
        thumbnailUrl: '/images/art-styles/felt-pen.webp',
        promptPrefix: 'Bold felt-pen illustration, thick vibrant strokes, bright saturated colours, playful energy,',
        isActive: true,
        order: 5,
    },
    {
        name: 'Cut-paper',
        slug: 'cut-paper',
        thumbnailUrl: '/images/art-styles/cut-paper.webp',
        promptPrefix: 'Paper collage cut-out art, layered shapes, subtle shadow depth, textured surfaces,',
        isActive: true,
        order: 6,
    },
    {
        name: 'Soft 3D',
        slug: 'soft-3d',
        thumbnailUrl: '/images/art-styles/soft-3d.webp',
        promptPrefix: 'Soft 3D rendered characters, clay-like textures, warm studio lighting, rounded forms,',
        isActive: true,
        order: 7,
    },
    {
        name: 'Comic Ink',
        slug: 'comic-ink',
        thumbnailUrl: '/images/art-styles/comic-ink.webp',
        promptPrefix: 'Dynamic comic book panels, bold ink outlines, halftone shading, expressive action lines,',
        isActive: true,
        order: 8,
    },
] as const;

async function main(): Promise<void> {
    const result = await prisma.artStyle.createMany({
        data: [...ART_STYLES],
        skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} art style(s). (${ART_STYLES.length - result.count} already existed)`);
}

main()
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
