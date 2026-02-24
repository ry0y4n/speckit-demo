import { prisma } from '@/lib/db';
import type { UserResponse } from '@/types';
import { UserSelectionClient } from './UserSelectionClient';

export default async function HomePage() {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });

  const usersResponse: UserResponse[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    avatarColor: user.avatarColor,
  }));

  return <UserSelectionClient users={usersResponse} />;
}
