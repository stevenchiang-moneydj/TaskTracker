
import React from 'react';
import { Task, Member } from '../types';
import { Timestamp } from '../services/firebase'; // Import Timestamp

interface TaskListProps {
  tasks: Task[];
  members: Member[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  filterAssigneeId: string | null;
  setFilterAssigneeId: (assigneeId: string | null) => void;
  isAdmin: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  members, 
  onEdit, 
  onDelete, 
  filterAssigneeId, 
  setFilterAssigneeId,
  isAdmin 
}) => {

  const formatDate = (timestamp?: Timestamp | null): string => { // Use imported Timestamp type
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const filteredTasks = filterAssigneeId === 'unassigned'
    ? tasks.filter(task => !task.assigneeId)
    : filterAssigneeId 
      ? tasks.filter(task => task.assigneeId === filterAssigneeId) 
      : tasks;

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case '高': return 'text-red-600 font-semibold';
      case '中': return 'text-yellow-600 font-semibold';
      case '低': return 'text-green-600 font-semibold';
      default: return 'text-gray-700';
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case '待辦': return 'bg-yellow-100 text-yellow-800';
      case '進行中': return 'bg-blue-100 text-blue-800';
      case '已完成': return 'bg-green-100 text-green-800';
      case '測試中': return 'bg-purple-100 text-purple-800';
      case '待安排': return 'bg-gray-200 text-gray-800'; // Darker gray for better visibility
      case '待Merge': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-4 md:p-6 overflow-x-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="assigneeFilter" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-0">篩選負責人:</label>
        <select
          id="assigneeFilter"
          value={filterAssigneeId || ''}
          onChange={(e) => setFilterAssigneeId(e.target.value || null)}
          className="w-full sm:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="">所有負責人</option>
          {members.map(member => (
            <option key={member.id} value={member.id}>{member.displayName}</option>
          ))}
           <option value="unassigned">未分配</option>
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <i className="fas fa-tasks fa-3x mb-3 text-gray-400"></i>
          <p className="text-xl">目前沒有符合條件的任務。</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 ">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">標題</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">優先級</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">負責人</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">狀態</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">開始日期</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">截止日期</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">產品</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">任務類型</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-w-xs">備註</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {task.gitIssueUrl ? (
                      <a href={task.gitIssueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                        {task.title} <i className="fas fa-external-link-alt fa-xs ml-1 opacity-70"></i>
                      </a>
                    ) : (
                      task.title
                    )}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm ${getPriorityClass(task.priority)}`}>{task.priority}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.assigneeName || <span className="italic text-gray-500">未分配</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(task.startDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.product}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.taskType}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={task.notes}>{task.notes || <span className="italic text-gray-400">-</span>}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-3">
                      <button onClick={() => onEdit(task)} className="text-blue-600 hover:text-blue-800 transition-colors duration-150" title="編輯">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => task.id && onDelete(task.id)} className="text-red-600 hover:text-red-800 transition-colors duration-150" title="刪除">
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TaskList;
