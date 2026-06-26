import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const STORY_BLUEPRINTS = [
    {
        name: 'Classic Book',
        description:
            'A warm, narrative-driven storybook with one illustration per page. Ideal for answering "why" and "how" questions through a gentle journey of discovery.',
        type: 'BOOK' as const,
        systemPrompt: `
<intro_prompt>
Open with a warm, engaging scene that introduces the main subject in a child-friendly way.
Use simple vocabulary appropriate for the child's age. Set up the central question or wonder
that the story will explore with warmth and clarity.
</intro_prompt>

<development_prompt>
Build the story across 2–3 discovery moments. Each page should reveal one new idea or fact,
shown through curiosity, observation, or a gentle chain of events. Keep sentences short and
vivid. Use sensory details — what the scene looks, sounds, or feels like — to make each
page feel alive.
</development_prompt>

<climax_prompt>
Bring the key revelation or "aha" moment. This is where the central question is answered in
a memorable, emotionally satisfying way. Let the scene carry genuine wonder or delight.
</climax_prompt>

<resolution_prompt>
Close with warmth and a gentle takeaway.
End on a hopeful or curious note that invites further exploration of the world.
</resolution_prompt>
        `.trim(),
    },
    {
        name: 'Classic Comic',
        description:
            'A dynamic, panel-driven comic with expressive characters, short dialogue, and visual gags. Perfect for energetic kids who love action and humour.',
        type: 'COMIC' as const,
        systemPrompt: `
<intro_prompt>
Open with a dynamic panel introducing the main character mid-action or mid-expression.
Use short, punchy dialogue. Establish the central question or challenge visually — show,
don't tell. Speech bubbles must be concise: no more than 12 words each.
</intro_prompt>

<development_prompt>
Build through visual gags, action beats, and quick dialogue exchanges. Each page spread should
have one clear discovery moment or visual joke. Keep the pacing fast — short sentences,
expressive reactions, and clear cause-and-effect between panels.
</development_prompt>

<climax_prompt>
Deliver the key reveal or punchline with maximum visual impact. Use a larger panel or splash
moment. Character reactions should be exaggerated and expressive — big eyes, arms wide,
mouth open. The answer to the central question should land with a laugh or a gasp.
</climax_prompt>

<resolution_prompt>
Wrap up with a satisfying final panel — a smile, a high-five, or a thumbs-up. Leave one small
visual gag in the background for attentive readers. End with the protagonist ready for the
next adventure.
</resolution_prompt>
        `.trim(),
    },
] as const;

async function main(): Promise<void> {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    if (!admin) {
        console.error('No ADMIN user found. Run `pnpm seed:admin <email>` first.');
        process.exit(1);
    }

    let seeded = 0;

    for (const blueprint of STORY_BLUEPRINTS) {
        const existing = await prisma.storyBlueprint.findFirst({
            where: { name: blueprint.name },
        });

        if (existing) {
            console.log(`  skip  "${blueprint.name}" — already exists`);
            continue;
        }

        await prisma.storyBlueprint.create({
            data: { ...blueprint, createdById: admin.id },
        });

        console.log(`  seed  "${blueprint.name}" (${blueprint.type})`);
        seeded++;
    }

    console.log(
        `\nDone. Seeded ${seeded} blueprint(s). (${STORY_BLUEPRINTS.length - seeded} already existed)`,
    );
}

main()
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
