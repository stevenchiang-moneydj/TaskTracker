import React, { useMemo } from 'react';
import { Task, Member, Status as StatusType } from '../types';
import { Priority } from '../services/firebase';

interface TaskDetailModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  members: Member[];
  priorities: Priority[];
  statuses: StatusType[];
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, task, onClose, members, priorities, statuses }) => {
  if (!isOpen || !task) return null;
  const assignee = members.find(m => m.id === task.assigneeId);
  const priorityObj = useMemo(() => priorities.find(p => p.id === task.priority), [priorities, task.priority]);
  const statusObj = useMemo(() => statuses.find(s => s.id === task.status), [statuses, task.status]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
          aria-label="關閉詳情"
        >
          &times;
        </button>
        <h3 className="text-2xl font-semibold mb-4 text-gray-800">任務詳情</h3>
        <div className="space-y-2 text-gray-700 text-sm">
          <div><span className="font-semibold">標題：</span>{task.title}</div>
          <div><span className="font-semibold">詳細說明：</span>{task.description || '-'}</div>
          <div><span className="font-semibold">Git Issue：</span>{task.gitIssueUrl ? <a href={task.gitIssueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{task.gitIssueUrl}</a> : '-'}</div>
          <div><span className="font-semibold">負責人：</span>{assignee ? assignee.displayName : (task.assigneeId ? '未知用戶' : '未分配')}</div>
          <div><span className="font-semibold">開始日期：</span>{task.startDate ? task.startDate.toDate().toLocaleDateString() : '-'}</div>
          <div><span className="font-semibold">截止日期：</span>{task.dueDate ? task.dueDate.toDate().toLocaleDateString() : '-'}</div>
          <div><span className="font-semibold">優先級：</span>{priorityObj ? priorityObj.levelName : '-'}</div>
          <div><span className="font-semibold">狀態：</span>{statusObj ? statusObj.statusName : '-'}</div>
          <div><span className="font-semibold">產品：</span>{task.product}</div>
          <div><span className="font-semibold">任務類型：</span>{task.taskType}</div>
          <div><span className="font-semibold">備註：</span>{task.notes || '-'}</div>
          <div><span className="font-semibold">建立時間：</span>{task.createdAt ? task.createdAt.toDate().toLocaleString() : '-'}</div>
          <div><span className="font-semibold">更新時間：</span>{task.updatedAt ? task.updatedAt.toDate().toLocaleString() : '-'}</div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
