import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../generated/prisma/client.js';

const email = process.argv[2];
const roleArg = process.argv[3] ?? 'ADMIN';

const PROMOTABLE_ROLES: readonly Role[] = [Role.ADMIN, Role.SUPER_ADMIN];

if (!email) {
    console.error('Usage: pnpm seed:admin <email> [ADMIN|SUPER_ADMIN]');
    process.exit(1);
}

function isPromotableRole(value: string): value is Role {
    return (PROMOTABLE_ROLES as readonly string[]).includes(value);
}

if (!isPromotableRole(roleArg)) {
    console.error(`Invalid role "${roleArg}". Use ADMIN or SUPER_ADMIN.`);
    process.exit(1);
}

const role = roleArg;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error(`User with email "${email}" not found. They must sign in first.`);
        process.exit(1);
    }

    if (user.role === role) {
        console.log(`User "${email}" is already a ${role}.`);
        return;
    }

    await prisma.user.update({ where: { email }, data: { role } });
    console.log(`User "${email}" has been promoted to ${role}.`);
}

main()
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
