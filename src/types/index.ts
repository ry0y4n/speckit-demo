import type { Role, TaskStatus } from '@prisma/client';

// ---- Entity types for API responses ----

export type UserResponse = {
  id: string;
  name: string;
  role: Role;
  avatarColor: string;
};

export type ProjectResponse = {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
};

export type TaskAssignee = {
  id: string;
  name: string;
  avatarColor: string;
};

export type TaskResponse = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  assignee: TaskAssignee | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CommentAuthor = {
  id: string;
  name: string;
  avatarColor: string;
};

export type CommentResponse = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
};

// ---- API response wrappers ----

export type UsersApiResponse = {
  users: UserResponse[];
};

export type ProjectsApiResponse = {
  projects: ProjectResponse[];
};

export type TasksApiResponse = {
  tasks: TaskResponse[];
};

export type CommentsApiResponse = {
  comments: CommentResponse[];
};

export type ErrorResponse = {
  error: string;
};

// ---- Server Action input types ----

export type UpdateTaskStatusInput = {
  taskId: string;
  status: TaskStatus;
  position: number;
};

export type AssignTaskInput = {
  taskId: string;
  assigneeId: string | null;
};

export type CreateCommentInput = {
  taskId: string;
  authorId: string;
  body: string;
};

export type UpdateCommentInput = {
  commentId: string;
  currentUserId: string;
  body: string;
};

export type DeleteCommentInput = {
  commentId: string;
  currentUserId: string;
};
