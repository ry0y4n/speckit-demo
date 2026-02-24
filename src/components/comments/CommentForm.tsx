'use client';

import { useState, useTransition } from 'react';
import { createComment } from '@/app/actions/comments';
import { Button } from '@/components/ui';

type CommentFormProps = {
  taskId: string;
  currentUserId: string;
  onCommentAdded: () => void;
};

export function CommentForm({ taskId, currentUserId, onCommentAdded }: CommentFormProps) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmedBody = body.trim();
  const isValid = trimmedBody.length > 0 && trimmedBody.length <= 5000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setError(null);
    startTransition(async () => {
      const result = await createComment({
        taskId,
        authorId: currentUserId,
        body: trimmedBody,
      });

      if (result.success) {
        setBody('');
        onCommentAdded();
      } else {
        setError(result.error ?? 'コメントの投稿に失敗しました');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="コメントを入力..."
        rows={3}
        maxLength={5000}
        disabled={isPending}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none
          disabled:bg-gray-50 disabled:text-gray-500 resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{trimmedBody.length} / 5000</span>
        <Button type="submit" size="sm" disabled={!isValid || isPending}>
          {isPending ? '投稿中...' : 'コメント'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
