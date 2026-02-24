'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Avatar, Badge, Card, CardBody } from '@/components/ui';
import type { UserResponse } from '@/types';

type UserSelectionClientProps = {
  users: UserResponse[];
};

const roleLabelMap: Record<string, string> = {
  PRODUCT_MANAGER: 'プロダクトマネージャー',
  ENGINEER: 'エンジニア',
};

export function UserSelectionClient({ users }: UserSelectionClientProps) {
  const { setCurrentUser } = useCurrentUser();
  const router = useRouter();

  const handleSelectUser = (user: UserResponse) => {
    setCurrentUser(user);
    router.push('/projects');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">ユーザーを選択</h2>
        <p className="mt-2 text-gray-600">操作するユーザーを選んでください</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} interactive onClick={() => handleSelectUser(user)}>
            <CardBody className="flex items-center gap-4">
              <Avatar name={user.name} color={user.avatarColor} size="lg" />
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <Badge variant={user.role === 'PRODUCT_MANAGER' ? 'info' : 'default'}>
                  {roleLabelMap[user.role] ?? user.role}
                </Badge>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
