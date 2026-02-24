'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">エラーが発生しました</h2>
        <p className="mt-2 text-sm text-gray-600">
          {error.message || '予期しないエラーが発生しました。'}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
