import { TaskStatus } from '@prisma/client';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: '未着手',
  [TaskStatus.IN_PROGRESS]: '進行中',
  [TaskStatus.IN_REVIEW]: 'レビュー中',
  [TaskStatus.DONE]: '完了',
};

export const COLUMN_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'bg-gray-100',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100',
  [TaskStatus.IN_REVIEW]: 'bg-yellow-100',
  [TaskStatus.DONE]: 'bg-green-100',
};
