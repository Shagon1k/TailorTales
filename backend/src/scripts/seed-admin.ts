import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const email = process.argv[2];

if (!email) {
    console.error('Usage: pnpm seed:admin <email>');
    process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error(`User with email "${email}" not found. They must sign in first.`);
        process.exit(1);
    }

    if (user.role === 'ADMIN') {
        console.log(`User "${email}" is already an ADMIN.`);
        return;
    }

    await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
    console.log(`User "${email}" has been promoted to ADMIN.`);
}

main()
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
