export default function BoardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        <p className="mt-3 text-sm text-gray-500">ボードを読み込み中...</p>
      </div>
    </div>
  );
}
