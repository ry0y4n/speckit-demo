import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { UserResponse } from '@/types';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    });

    const response: UserResponse[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
    }));

    return NextResponse.json({ users: response });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}
