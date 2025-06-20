import React, { useState } from 'react';
import { Task, Member, Status as StatusType } from '../types';
import { Priority, Timestamp } from '../services/firebase'; // Import Priority and Timestamp

interface TaskListProps {
  tasks: Task[];
  members: Member[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  filterAssigneeId: string | null;
  setFilterAssigneeId: (assigneeId: string | null) => void;
  isAdmin: boolean;
  onViewDetail: (task: Task) => void;
  priorities: Priority[]; // 新增 prop
  statuses: StatusType[];
}

const RESPONSIBLE_TABS = [
  { key: 'all', label: '全部' },
  { key: '耀頡', label: '耀頡' },
  { key: '家銘', label: '家銘' },
  { key: '韋辰', label: '韋辰' },
  { key: '政澤', label: '政澤' },
];

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  members, 
  onEdit, 
  onDelete, 
  filterAssigneeId, 
  setFilterAssigneeId,
  isAdmin,
  onViewDetail,
  priorities,
  statuses
}) => {
  const [activeMainTab] = useState('負責人'); // 目前僅一個大頁籤
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [hideDone, setHideDone] = useState(false);

  const formatDate = (timestamp?: Timestamp | null): string => { // Use imported Timestamp type
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const filteredTasks = filterAssigneeId === 'unassigned'
    ? tasks.filter(task => !task.assigneeId)
    : filterAssigneeId 
      ? tasks.filter(task => task.assigneeId === filterAssigneeId) 
      : tasks;

  const getPriorityClass = (priorityId: string) => {
    const p = priorities.find(p => p.id === priorityId);
    if (!p) return 'bg-gray-200 text-gray-700';
    switch (p.levelName) {
      case '緊急': return 'bg-red-100 text-red-800 font-bold';
      case '優先': return 'bg-blue-100 text-blue-900 font-bold';
      case '一般': return 'bg-green-100 text-green-800 font-bold';
      case '低': return 'bg-green-50 text-green-400 font-semibold';
      case '擱置': return 'bg-gray-100 text-gray-400 font-semibold';
      default: return 'bg-gray-200 text-gray-700';
    }
  };
  const getPriorityName = (priorityId: string) => {
    const p = priorities.find(p => p.id === priorityId);
    return p ? p.levelName : '-';
  };

  const getStatusClass = (statusId: string) => {
    const s = statuses.find(s => s.id === statusId);
    if (!s) return 'bg-gray-300 text-gray-700';
    switch (s.statusName) {
      case '待安排': return 'bg-gray-100 text-gray-700 border border-gray-300';
      case '評估中': return 'bg-cyan-100 text-cyan-900 border border-cyan-300';
      case '進行中': return 'bg-blue-100 text-blue-900 border border-blue-300';
      case '測試中': return 'bg-yellow-100 text-yellow-900 border border-yellow-300';
      case '待Merge': return 'bg-indigo-100 text-indigo-900 border border-indigo-300';
      case '已完成': return 'bg-green-100 text-green-900 border border-green-300';
      case '追蹤': return 'bg-pink-100 text-pink-900 border border-pink-300';
      case '暫停': return 'bg-orange-100 text-orange-900 border border-orange-300';
      case '停止': return 'bg-gray-200 text-gray-500 border border-gray-300';
      default: return 'bg-gray-200 text-gray-700 border border-gray-300';
    }
  };
  const getStatusName = (statusId: string) => {
    const s = statuses.find(s => s.id === statusId);
    return s ? s.statusName : '-';
  };

  // 依小頁籤篩選
  let displayTasks: Task[] = tasks;
  if (activeSubTab !== 'all') {
    const member = members.find(m => m.displayName === activeSubTab);
    displayTasks = member ? tasks.filter(t => t.assigneeId === member.id) : [];
  }
  if (hideDone) {
    displayTasks = displayTasks.filter(t => t.status !== '已完成');
  }

  // 分群顯示（全部）
  // 依 RESPONSIBLE_TABS 順序排序 members
  const memberOrder = RESPONSIBLE_TABS.map(tab => tab.label);
  const groupedTasks = memberOrder
    .map(name => {
      const member = members.find(m => m.displayName === name);
      return member ? { member, tasks: displayTasks.filter(t => t.assigneeId === member.id) } : null;
    })
    .filter(group => group && group.tasks.length > 0) as { member: Member, tasks: Task[] }[];
  const unassignedTasks = displayTasks.filter(t => !t.assigneeId);

  // 共用表格欄寬設定
  const TableColGroup = () => (
    <colgroup>
      <col /> {/* 標題 */}
      <col style={{ width: 'auto' }} /> {/* 優先級 */}
      <col style={{ width: 'auto' }} /> {/* 負責人 */}
      <col /> {/* 狀態 */}
      <col className="hidden md:table-column" /> {/* 開始日期 */}
      <col className="hidden sm:table-column" /> {/* 截止日期 */}
      <col className="hidden lg:table-column" /> {/* 產品 */}
      <col className="hidden xl:table-column" /> {/* 任務類型 */}
      <col className="hidden 2xl:table-column" /> {/* 備註 */}
      {/* 操作欄不設寬度，讓其自適應 */}
    </colgroup>
  );

  const TableHeader = ({ isAdmin }: { isAdmin: boolean }) => (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">標題</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">優先級</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">負責人</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">狀態</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">開始日期</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">截止日期</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">產品</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">任務類型</th>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider max-w-xs hidden 2xl:table-cell">備註</th>
        {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>}
      </tr>
    </thead>
  );

  if (!priorities || priorities.length === 0) {
    return <div className="text-gray-500 text-center py-8">載入優先級資料中...</div>;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-4 md:p-6">
      {/* 大頁籤 */}
      <div className="mb-4 border-b border-gray-200">
        <button className="px-4 py-2 text-blue-700 font-semibold border-b-2 border-blue-600 bg-white" disabled>
          負責人
        </button>
      </div>
      {/* 小頁籤 */}
      <div className="mb-6 flex items-center space-x-2">
        {RESPONSIBLE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-t-lg font-medium focus:outline-none transition-colors duration-150 ${activeSubTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
            onClick={() => setActiveSubTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
        {/* 隱藏已完成 checkbox */}
        <label className="flex items-center ml-4 select-none text-sm text-gray-700">
          <input
            type="checkbox"
            className="mr-1.5 accent-blue-600"
            checked={hideDone}
            onChange={e => setHideDone(e.target.checked)}
          />
          隱藏已完成
        </label>
      </div>
      {/* 內容區 */}
      {activeSubTab === 'all' ? (
        <>
          {groupedTasks.map(group => (
            <div key={group.member.id} className="mb-8">
              <div className="font-bold text-lg text-blue-700 mb-2">{group.member.displayName}</div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 mb-4">
                  <TableColGroup />
                  <TableHeader isAdmin={isAdmin} />
                  <tbody className="bg-white divide-y divide-gray-200">
                    {group.tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-blue-50 cursor-pointer transition-colors duration-150" onClick={() => onViewDetail(task)}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium" onClick={e => e.stopPropagation()}>
                          {task.gitIssueUrl ? (
                            <a href={task.gitIssueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                              {task.title} <i className="fas fa-external-link-alt fa-xs ml-1 opacity-70"></i>
                            </a>
                          ) : (
                            task.title
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.priority)}`}>{getPriorityName(task.priority)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.assigneeName || <span className="italic text-gray-500">未分配</span>}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)}`}>{getStatusName(task.status)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">{formatDate(task.startDate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">{formatDate(task.dueDate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">{task.product}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden xl:table-cell">{task.taskType}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate hidden 2xl:table-cell" title={task.notes}>{task.notes || <span className="italic text-gray-400">-</span>}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-3" onClick={e => e.stopPropagation()}>
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
            </div>
          ))}
          {unassignedTasks.length > 0 && (
            <div className="mb-8">
              <div className="font-bold text-lg text-gray-500 mb-2">未分配</div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 mb-4">
                  <TableColGroup />
                  <TableHeader isAdmin={isAdmin} />
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unassignedTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-blue-50 cursor-pointer transition-colors duration-150" onClick={() => onViewDetail(task)}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium" onClick={e => e.stopPropagation()}>
                          {task.gitIssueUrl ? (
                            <a href={task.gitIssueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                              {task.title} <i className="fas fa-external-link-alt fa-xs ml-1 opacity-70"></i>
                            </a>
                          ) : (
                            task.title
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.priority)}`}>{getPriorityName(task.priority)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.assigneeName || <span className="italic text-gray-500">未分配</span>}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)}`}>{getStatusName(task.status)}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">{formatDate(task.startDate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">{formatDate(task.dueDate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">{task.product}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden xl:table-cell">{task.taskType}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate hidden 2xl:table-cell" title={task.notes}>{task.notes || <span className="italic text-gray-400">-</span>}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-3" onClick={e => e.stopPropagation()}>
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
            </div>
          )}
        </>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <TableColGroup />
            <TableHeader isAdmin={isAdmin} />
            <tbody className="bg-white divide-y divide-gray-200">
              {displayTasks.map((task) => (
                <tr key={task.id} className="hover:bg-blue-50 cursor-pointer transition-colors duration-150" onClick={() => onViewDetail(task)}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium" onClick={e => e.stopPropagation()}>
                    {task.gitIssueUrl ? (
                      <a href={task.gitIssueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">
                        {task.title} <i className="fas fa-external-link-alt fa-xs ml-1 opacity-70"></i>
                      </a>
                    ) : (
                      task.title
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.priority)}`}>{getPriorityName(task.priority)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.assigneeName || <span className="italic text-gray-500">未分配</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)}`}>{getStatusName(task.status)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">{formatDate(task.startDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">{formatDate(task.dueDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">{task.product}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden xl:table-cell">{task.taskType}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate hidden 2xl:table-cell" title={task.notes}>{task.notes || <span className="italic text-gray-400">-</span>}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-3" onClick={e => e.stopPropagation()}>
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
