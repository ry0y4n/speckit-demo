'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, Badge } from '@/components/ui';
import type { TaskResponse, UserResponse } from '@/types';

type TaskCardProps = {
  task: TaskResponse;
  isCurrentUser: boolean;
  users?: UserResponse[];
  onAssigneeChange?: (taskId: string, assigneeId: string | null) => void;
  onClick?: () => void;
};

export function TaskCard({ task, isCurrentUser, users, onAssigneeChange, onClick }: TaskCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardStyle = isCurrentUser
    ? { ...style, borderLeftColor: task.assignee?.avatarColor }
    : style;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleAssigneeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  const handleSelectAssignee = (e: React.MouseEvent, assigneeId: string | null) => {
    e.stopPropagation();
    setShowDropdown(false);
    onAssigneeChange?.(task.id, assigneeId);
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      className={`rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'z-50 opacity-75 shadow-lg' : ''
      } ${isCurrentUser ? 'border-l-4' : 'border-gray-200'}`}
      onClick={onClick}
    >
      <div className="mb-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
      </div>
      {task.description && (
        <p className="mb-2 text-xs text-gray-500 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleAssigneeClick}
            className="flex items-center gap-1 rounded p-0.5 hover:bg-gray-100"
            title={task.assignee ? task.assignee.name : '担当者を割り当て'}
          >
            {task.assignee ? (
              <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size="sm" />
            ) : (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-xs text-gray-400">
                ?
              </span>
            )}
          </button>
          {showDropdown && users && (
            <div className="absolute left-0 top-8 z-50 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={(e) => handleSelectAssignee(e, null)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50"
              >
                担当者なし
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={(e) => handleSelectAssignee(e, user.id)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                    task.assignee?.id === user.id
                      ? 'bg-indigo-50 font-medium text-indigo-700'
                      : 'text-gray-700'
                  }`}
                >
                  <Avatar name={user.name} color={user.avatarColor} size="sm" />
                  {user.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {task.commentCount > 0 && <Badge variant="default">💬 {task.commentCount}</Badge>}
      </div>
    </div>
  );
}
