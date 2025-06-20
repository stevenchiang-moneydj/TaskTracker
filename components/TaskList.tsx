import React, { useState } from 'react';
import { Task, Member, Status as StatusType, Product, TaskType } from '../types';
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
  onQuickUpdate?: (taskId: string, field: 'priority'|'assignee'|'status'|'startDate'|'dueDate'|'product', value: string) => void; // 新增 product
  products: Product[]; // 新增 products prop
  taskTypes: TaskType[];
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
  statuses,
  onQuickUpdate,
  products,
  taskTypes
}) => {
  const [activeMainTab] = useState('負責人'); // 目前僅一個大頁籤
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [hideDone, setHideDone] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{taskId: string, field: 'priority'|'assignee'|'status'|'startDate'|'dueDate'|'product'}|null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string|null>(null);

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

  const getTaskTypeName = (taskTypeId: string) => {
    const tt = taskTypes.find(tt => tt.id === taskTypeId);
    return tt ? tt.typeName : '-';
  };

  // 狀態與優先級排序依據
  const statusOrder = ['進行中', '評估中', '待Merge', '測試中', '待安排', '追蹤', '已完成'];
  const priorityOrder = ['緊急', '優先', '一般', '低', '擱置'];

  function getStatusSortIndex(statusId: string) {
    const s = statuses.find(s => s.id === statusId);
    if (!s) return statusOrder.length;
    const idx = statusOrder.indexOf(s.statusName);
    return idx === -1 ? statusOrder.length : idx;
  }
  function getPrioritySortIndex(priorityId: string) {
    const p = priorities.find(p => p.id === priorityId);
    if (!p) return priorityOrder.length;
    const idx = priorityOrder.indexOf(p.levelName);
    return idx === -1 ? priorityOrder.length : idx;
  }

  function compareTasks(a: Task, b: Task) {
    // 1. 狀態
    const statusDiff = getStatusSortIndex(a.status) - getStatusSortIndex(b.status);
    if (statusDiff !== 0) return statusDiff;
    // 2. 優先級
    const priorityDiff = getPrioritySortIndex(a.priority) - getPrioritySortIndex(b.priority);
    if (priorityDiff !== 0) return priorityDiff;
    // 3. 截止日遞減
    const aDue = a.dueDate ? a.dueDate.toDate().getTime() : 0;
    const bDue = b.dueDate ? b.dueDate.toDate().getTime() : 0;
    return bDue - aDue;
  }

  // 依小頁籤篩選
  let displayTasks: Task[] = tasks;
  if (activeSubTab !== 'all') {
    const member = members.find(m => m.displayName === activeSubTab);
    displayTasks = member ? tasks.filter(t => t.assigneeId === member.id) : [];
  }
  if (hideDone) {
    // 取得 "已完成" 與 "停止" status 的 id
    const doneStatus = statuses.find(s => s.statusName === '已完成');
    const stoppedStatus = statuses.find(s => s.statusName === '停止');
    displayTasks = displayTasks.filter(t => t.status !== doneStatus?.id && t.status !== stoppedStatus?.id);
  }
  displayTasks = [...displayTasks].sort(compareTasks);

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

  // 判斷截止日是否緊急（今天、已過期、明天，且狀態為特定值）
  const isDueDateUrgent = (dueDate: Timestamp | null | undefined, statusId: string) => {
    if (!dueDate) return false;
    const urgentStatusNames = ['待安排', '評估中', '進行中', '測試中'];
    const status = statuses.find(s => s.id === statusId);
    if (!status || !urgentStatusNames.includes(status.statusName)) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = dueDate.toDate();
    due.setHours(0,0,0,0);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000*60*60*24));
    // 今天、已過期、明天都標紅
    return diffDays <= 1;
  };

  // 取得產品名稱
  const getProductName = (productId: string) => {
    const p = products.find(p => p.id === productId);
    return p ? p.productName : '-';
  };

  // 產品下拉選單排序
  const sortedProducts = [...products].sort((a, b) => Number(a.productNumber) - Number(b.productNumber));

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

  // 快速更新任務欄位
  const handleQuickUpdate = (task: Task, field: 'priority'|'assignee'|'status'|'startDate'|'dueDate'|'product', value: string) => {
    if (onQuickUpdate) {
      if (field === 'priority' && value !== task.priority) {
        onQuickUpdate(task.id!, 'priority', value);
      } else if (field === 'assignee' && value !== (task.assigneeId || '')) {
        onQuickUpdate(task.id!, 'assignee', value);
      } else if (field === 'status' && value !== task.status) {
        onQuickUpdate(task.id!, 'status', value);
      } else if (field === 'startDate') {
        onQuickUpdate(task.id!, 'startDate', value);
      } else if (field === 'dueDate') {
        onQuickUpdate(task.id!, 'dueDate', value);
      } else if (field === 'product' && value !== task.product) {
        onQuickUpdate(task.id!, 'product', value);
      }
    }
    setEditingField(null);
  };

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
          隱藏已完成或停止
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
                      <tr key={task.id}
                          className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                          onContextMenu={e => { e.preventDefault(); onViewDetail(task); }}
                      >
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
                          {editingField && editingField.taskId === task.id && editingField.field === 'priority' ? (
                            <select
                              className={`ml-1 text-xs px-2 py-1 rounded ${getPriorityClass(task.priority)}`}
                              value={task.priority}
                              onChange={e => handleQuickUpdate(task, 'priority', e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            >
                              {priorities.map(p => (
                                <option key={p.id} value={p.id} className={getPriorityClass(p.id)}>{p.levelName}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.priority)} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                              onClick={isAdmin ? (e) => {
                                e.stopPropagation();
                                setEditingField({taskId: task.id!, field: 'priority'});
                                setTimeout(() => {
                                  const select = document.getElementById(`priority-select-${task.id}`) as HTMLSelectElement;
                                  if (select) select.focus();
                                }, 0);
                              } : undefined}
                            >
                              {getPriorityName(task.priority)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {editingField && editingField.taskId === task.id && editingField.field === 'assignee' ? (
                            <select
                              id={`assignee-select-${task.id}`}
                              className="ml-1 text-xs px-2 py-1 rounded bg-white border border-gray-300"
                              value={task.assigneeId || ''}
                              onChange={e => handleQuickUpdate(task, 'assignee', e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            >
                              <option value="">未分配</option>
                              {members.map(m => (
                                <option key={m.id} value={m.id}>{m.displayName}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                              onClick={isAdmin ? (e) => {
                                e.stopPropagation();
                                setEditingField({taskId: task.id!, field: 'assignee'});
                                setTimeout(() => {
                                  const select = document.getElementById(`assignee-select-${task.id}`) as HTMLSelectElement;
                                  if (select) select.focus();
                                }, 0);
                              } : undefined}
                            >
                              {task.assigneeName || <span className="italic text-gray-500">未分配</span>}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {editingField && editingField.taskId === task.id && editingField.field === 'status' ? (
                            <select
                              id={`status-select-${task.id}`}
                              className={`ml-1 text-xs px-2 py-1 rounded ${getStatusClass(task.status)}`}
                              value={task.status}
                              onChange={e => handleQuickUpdate(task, 'status', e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            >
                              {statuses.map(s => (
                                <option key={s.id} value={s.id} className={getStatusClass(s.id)}>{s.statusName}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                              onClick={isAdmin ? (e) => {
                                e.stopPropagation();
                                setEditingField({taskId: task.id!, field: 'status'});
                                setTimeout(() => {
                                  const select = document.getElementById(`status-select-${task.id}`) as HTMLSelectElement;
                                  if (select) select.focus();
                                }, 0);
                              } : undefined}
                            >
                              {getStatusName(task.status)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                          {isAdmin && editingField && editingField.taskId === task.id && editingField.field === 'startDate' ? (
                            <input
                              type="date"
                              className="border rounded px-2 py-1 text-xs"
                              value={task.startDate ? task.startDate.toDate().toISOString().slice(0, 10) : ''}
                              onChange={e => handleQuickUpdate(task, 'startDate', e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            />
                          ) : (
                            <span className="flex items-center">
                              {formatDate(task.startDate)}
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="ml-1 text-gray-400 hover:text-blue-500 focus:outline-none"
                                  title="選擇開始日期"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingField({ taskId: task.id!, field: 'startDate' as any });
                                  }}
                                >
                                  <i className="far fa-calendar-alt"></i>
                                </button>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          {isAdmin && editingField && editingField.taskId === task.id && editingField.field === 'dueDate' ? (
                            <input
                              type="date"
                              className="border rounded px-2 py-1 text-xs"
                              value={task.dueDate ? task.dueDate.toDate().toISOString().slice(0, 10) : ''}
                              min={task.startDate ? task.startDate.toDate().toISOString().slice(0, 10) : undefined}
                              onChange={e => {
                                const selected = e.target.value;
                                if (task.startDate && selected && selected < task.startDate.toDate().toISOString().slice(0, 10)) {
                                  alert('截止日不可早於開始日，請重新選擇！');
                                  e.target.value = '';
                                  return;
                                }
                                handleQuickUpdate(task, 'dueDate', selected);
                              }}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            />
                          ) : (
                            <span className={`flex items-center ${isDueDateUrgent(task.dueDate, task.status) ? 'text-red-600 font-bold animate-pulse' : ''}`}>
                              {formatDate(task.dueDate)}
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="ml-1 text-gray-400 hover:text-blue-500 focus:outline-none"
                                  title="選擇截止日期"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingField({ taskId: task.id!, field: 'dueDate' as any });
                                  }}
                                >
                                  <i className="far fa-calendar-alt"></i>
                                </button>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">
                          {getProductName(task.product)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden xl:table-cell">{getTaskTypeName(task.taskType)}</td>
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
                      <tr key={task.id} className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                          onContextMenu={e => { e.preventDefault(); onViewDetail(task); }}>
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
                          {editingField && editingField.taskId === task.id && editingField.field === 'priority' ? (
                            <select
                              id={`priority-select-${task.id}`}
                              className={`ml-1 text-xs px-2 py-1 rounded ${getPriorityClass(task.priority)}`}
                              value={task.priority}
                              onChange={e => handleQuickUpdate(task, 'priority', e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            >
                              {priorities.map(p => (
                                <option key={p.id} value={p.id} className={getPriorityClass(p.id)}>{p.levelName}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.priority)} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                              onClick={isAdmin ? (e) => {
                                e.stopPropagation();
                                setEditingField({taskId: task.id!, field: 'priority'});
                                setTimeout(() => {
                                  const select = document.getElementById(`priority-select-${task.id}`) as HTMLSelectElement;
                                  if (select) select.focus();
                                }, 0);
                              } : undefined}
                            >
                              {getPriorityName(task.priority)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {editingField && editingField.taskId === task.id && editingField.field === 'assignee' ? (
                            <select
                              id={`assignee-select-${task.id}`}
                              className="ml-1 text-xs px-2 py-1 rounded bg-white border border-gray-300"
                              value={task.assigneeId || ''}
                              onChange={e => handleQuickUpdate(task, 'assignee', e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            >
                              <option value="">未分配</option>
                              {members.map(m => (
                                <option key={m.id} value={m.id}>{m.displayName}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                              onClick={isAdmin ? (e) => {
                                e.stopPropagation();
                                setEditingField({taskId: task.id!, field: 'assignee'});
                                setTimeout(() => {
                                  const select = document.getElementById(`assignee-select-${task.id}`) as HTMLSelectElement;
                                  if (select) select.focus();
                                }, 0);
                              } : undefined}
                            >
                              {task.assigneeName || <span className="italic text-gray-500">未分配</span>}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {editingField && editingField.taskId === task.id && editingField.field === 'status' ? (
                            <select
                              id={`status-select-${task.id}`}
                              className={`ml-1 text-xs px-2 py-1 rounded ${getStatusClass(task.status)}`}
                              value={task.status}
                              onChange={e => handleQuickUpdate(task, 'status', e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            >
                              {statuses.map(s => (
                                <option key={s.id} value={s.id} className={getStatusClass(s.id)}>{s.statusName}</option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                              onClick={isAdmin ? (e) => {
                                e.stopPropagation();
                                setEditingField({taskId: task.id!, field: 'status'});
                                setTimeout(() => {
                                  const select = document.getElementById(`status-select-${task.id}`) as HTMLSelectElement;
                                  if (select) select.focus();
                                }, 0);
                              } : undefined}
                            >
                              {getStatusName(task.status)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                          {isAdmin && editingField && editingField.taskId === task.id && editingField.field === 'startDate' ? (
                            <input
                              type="date"
                              className="border rounded px-2 py-1 text-xs"
                              value={task.startDate ? task.startDate.toDate().toISOString().slice(0, 10) : ''}
                              onChange={e => handleQuickUpdate(task, 'startDate', e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            />
                          ) : (
                            <span className="flex items-center">
                              {formatDate(task.startDate)}
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="ml-1 text-gray-400 hover:text-blue-500 focus:outline-none"
                                  title="選擇開始日期"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingField({ taskId: task.id!, field: 'startDate' as any });
                                  }}
                                >
                                  <i className="far fa-calendar-alt"></i>
                                </button>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                          {isAdmin && editingField && editingField.taskId === task.id && editingField.field === 'dueDate' ? (
                            <input
                              type="date"
                              className="border rounded px-2 py-1 text-xs"
                              value={task.dueDate ? task.dueDate.toDate().toISOString().slice(0, 10) : ''}
                              min={task.startDate ? task.startDate.toDate().toISOString().slice(0, 10) : undefined}
                              onChange={e => {
                                const selected = e.target.value;
                                if (task.startDate && selected && selected < task.startDate.toDate().toISOString().slice(0, 10)) {
                                  alert('截止日不可早於開始日，請重新選擇！');
                                  e.target.value = '';
                                  return;
                                }
                                handleQuickUpdate(task, 'dueDate', selected);
                              }}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            />
                          ) : (
                            <span className={`flex items-center ${isDueDateUrgent(task.dueDate, task.status) ? 'text-red-600 font-bold animate-pulse' : ''}`}>
                              {formatDate(task.dueDate)}
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="ml-1 text-gray-400 hover:text-blue-500 focus:outline-none"
                                  title="選擇截止日期"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setEditingField({ taskId: task.id!, field: 'dueDate' as any });
                                  }}
                                >
                                  <i className="far fa-calendar-alt"></i>
                                </button>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">
                          {getProductName(task.product)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden xl:table-cell">{getTaskTypeName(task.taskType)}</td>
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
                <tr key={task.id} className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                    onContextMenu={e => { e.preventDefault(); onViewDetail(task); }}>
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
                    {editingField && editingField.taskId === task.id && editingField.field === 'priority' ? (
                      <select
                        className={`ml-1 text-xs px-2 py-1 rounded ${getPriorityClass(task.priority)}`}
                        value={task.priority}
                        onChange={e => handleQuickUpdate(task, 'priority', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                      >
                        {priorities.map(p => (
                          <option key={p.id} value={p.id} className={getPriorityClass(p.id)}>{p.levelName}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(task.priority)} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                        onClick={isAdmin ? (e) => {
                          e.stopPropagation();
                          setEditingField({taskId: task.id!, field: 'priority'});
                          setTimeout(() => {
                            const select = document.getElementById(`priority-select-${task.id}`) as HTMLSelectElement;
                            if (select) select.focus();
                          }, 0);
                        } : undefined}
                      >
                        {getPriorityName(task.priority)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {editingField && editingField.taskId === task.id && editingField.field === 'assignee' ? (
                      <select
                        id={`assignee-select-${task.id}`}
                        className="ml-1 text-xs px-2 py-1 rounded bg-white border border-gray-300"
                        value={task.assigneeId || ''}
                        onChange={e => handleQuickUpdate(task, 'assignee', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                      >
                        <option value="">未分配</option>
                        {members.map(m => (
                          <option key={m.id} value={m.id}>{m.displayName}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                        onClick={isAdmin ? (e) => {
                          e.stopPropagation();
                          setEditingField({taskId: task.id!, field: 'assignee'});
                          setTimeout(() => {
                            const select = document.getElementById(`assignee-select-${task.id}`) as HTMLSelectElement;
                            if (select) select.focus();
                          }, 0);
                        } : undefined}
                      >
                        {task.assigneeName || <span className="italic text-gray-500">未分配</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {editingField && editingField.taskId === task.id && editingField.field === 'status' ? (
                      <select
                        id={`status-select-${task.id}`}
                        className={`ml-1 text-xs px-2 py-1 rounded ${getStatusClass(task.status)}`}
                        value={task.status}
                        onChange={e => handleQuickUpdate(task, 'status', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                      >
                        {statuses.map(s => (
                          <option key={s.id} value={s.id} className={getStatusClass(s.id)}>{s.statusName}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(task.status)} ${isAdmin ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''}`}
                        onClick={isAdmin ? (e) => {
                          e.stopPropagation();
                          setEditingField({taskId: task.id!, field: 'status'});
                          setTimeout(() => {
                            const select = document.getElementById(`status-select-${task.id}`) as HTMLSelectElement;
                            if (select) select.focus();
                          }, 0);
                        } : undefined}
                      >
                        {getStatusName(task.status)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                    {isAdmin && editingField && editingField.taskId === task.id && editingField.field === 'startDate' ? (
                      <input
                        type="date"
                        className="border rounded px-2 py-1 text-xs"
                        value={task.startDate ? task.startDate.toDate().toISOString().slice(0, 10) : ''}
                        onChange={e => handleQuickUpdate(task, 'startDate', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                      />
                    ) : (
                      <span className="flex items-center">
                        {formatDate(task.startDate)}
                        {isAdmin && (
                          <button
                            type="button"
                            className="ml-1 text-gray-400 hover:text-blue-500 focus:outline-none"
                            title="選擇開始日期"
                            onClick={e => {
                              e.stopPropagation();
                              setEditingField({ taskId: task.id!, field: 'startDate' as any });
                            }}
                          >
                            <i className="far fa-calendar-alt"></i>
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                    {isAdmin && editingField && editingField.taskId === task.id && editingField.field === 'dueDate' ? (
                      <input
                        type="date"
                        className="border rounded px-2 py-1 text-xs"
                        value={task.dueDate ? task.dueDate.toDate().toISOString().slice(0, 10) : ''}
                        min={task.startDate ? task.startDate.toDate().toISOString().slice(0, 10) : undefined}
                        onChange={e => {
                          const selected = e.target.value;
                          if (task.startDate && selected && selected < task.startDate.toDate().toISOString().slice(0, 10)) {
                            alert('截止日不可早於開始日，請重新選擇！');
                            e.target.value = '';
                            return;
                          }
                          handleQuickUpdate(task, 'dueDate', selected);
                        }}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                      />
                    ) : (
                      <span className={`flex items-center ${isDueDateUrgent(task.dueDate, task.status) ? 'text-red-600 font-bold animate-pulse' : ''}`}>
                        {formatDate(task.dueDate)}
                        {isAdmin && (
                          <button
                            type="button"
                            className="ml-1 text-gray-400 hover:text-blue-500 focus:outline-none"
                            title="選擇截止日期"
                            onClick={e => {
                              e.stopPropagation();
                              setEditingField({ taskId: task.id!, field: 'dueDate' as any });
                            }}
                          >
                            <i className="far fa-calendar-alt"></i>
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden lg:table-cell">
                    {getProductName(task.product)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 hidden xl:table-cell">{getTaskTypeName(task.taskType)}</td>
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
