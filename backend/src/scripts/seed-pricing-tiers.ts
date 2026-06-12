import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

function nextMonth(): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Paddle catalog ids come from env so the seed stays committable; null until
// the Paddle sandbox/live catalog exists (see _docs Paddle setup guide).
const PRICING_TIERS = [
    {
        name: 'Free Chapter',
        paddleProductId: null,
        paddlePriceId: null,
        priceMonthly: 0,
        pagesPerMonth: 12,
        regenerationsPerMonth: 3,
        childrenLimit: 1,
        retentionDays: 30,
        watermark: true,
        order: 1,
    },
    {
        name: 'Story Hour',
        paddleProductId: process.env.PADDLE_PRODUCT_ID_STORY_HOUR ?? null,
        paddlePriceId: process.env.PADDLE_PRICE_ID_STORY_HOUR ?? null,
        priceMonthly: 500,
        pagesPerMonth: 60,
        regenerationsPerMonth: 10,
        childrenLimit: 3,
        retentionDays: null,
        watermark: false,
        order: 2,
    },
    {
        name: 'Family Workshop',
        paddleProductId: process.env.PADDLE_PRODUCT_ID_FAMILY_WORKSHOP ?? null,
        paddlePriceId: process.env.PADDLE_PRICE_ID_FAMILY_WORKSHOP ?? null,
        priceMonthly: 1000,
        pagesPerMonth: 150,
        regenerationsPerMonth: 30,
        childrenLimit: null,
        retentionDays: null,
        watermark: false,
        order: 3,
    },
] as const;

async function main(): Promise<void> {
    for (const tier of PRICING_TIERS) {
        await prisma.pricingTier.upsert({
            where: { name: tier.name },
            create: tier,
            update: tier,
        });
    }
    console.log(`Seeded ${PRICING_TIERS.length} pricing tier(s).`);

    // Backfill: every user without a Subscription gets a free-tier row.
    // (Phase 8 regeneration usage was carried over by the
    // drop_user_regeneration_quota_columns migration, not here.)
    const freeTier = await prisma.pricingTier.findUniqueOrThrow({
        where: { name: 'Free Chapter' },
    });
    const usersWithoutSubscription = await prisma.user.findMany({
        where: { subscription: null },
        select: { id: true },
    });

    for (const user of usersWithoutSubscription) {
        await prisma.subscription.create({
            data: { userId: user.id, pricingTierId: freeTier.id, currentPeriodEnd: nextMonth() },
        });
    }
    console.log(`Backfilled free subscriptions for ${usersWithoutSubscription.length} user(s).`);
}

main()
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
