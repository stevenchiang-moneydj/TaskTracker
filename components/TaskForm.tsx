import React, { useState, useEffect } from 'react';
import { Task, Status as StatusType, Product, TaskType, Member } from '../types';
import { Timestamp, Priority } from '../services/firebase';
import { PRODUCT_OPTIONS, TASK_TYPE_OPTIONS } from '../constants';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Task) => Promise<void>;
  initialTask?: Task | null;
  members: Member[];
  priorities: Priority[];
  statuses: StatusType[];
}

const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, onSubmit, initialTask, members, priorities, statuses }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gitIssueUrl, setGitIssueUrl] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [product, setProduct] = useState<Product>(Product.XQ);
  const [taskType, setTaskType] = useState<TaskType>(TaskType.SPEC);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setGitIssueUrl(initialTask.gitIssueUrl || '');
      setAssigneeId(initialTask.assigneeId || undefined);
      setStartDate(initialTask.startDate ? initialTask.startDate.toDate().toISOString().split('T')[0] : undefined);
      setDueDate(initialTask.dueDate ? initialTask.dueDate.toDate().toISOString().split('T')[0] : undefined);
      setPriority(initialTask.priority || '');
      setStatus(initialTask.status || (statuses[0]?.id || ''));
      setProduct(initialTask.product);
      setTaskType(initialTask.taskType);
      setNotes(initialTask.notes || '');
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setGitIssueUrl('');
      setAssigneeId(undefined);
      setStartDate(undefined);
      setDueDate(undefined);
      // 預設選到 levelName 為「一般」的 priorityId
      const normal = priorities.find(p => p.levelName === '一般');
      setPriority(normal ? normal.id : (priorities[0]?.id || ''));
      // 預設選到 statusName 為「待安排」的 statusId
      const defaultStatus = statuses.find(s => s.statusName === '待安排');
      setStatus(defaultStatus ? defaultStatus.id : (statuses[0]?.id || ''));
      setProduct(Product.XQ);
      setTaskType(TaskType.SPEC);
      setNotes('');
    }
    setError(null); // Clear previous errors when form opens or initialTask changes
  }, [initialTask, isOpen, priorities, statuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("標題為必填欄位。");
      return;
    }
    setError(null);
    setIsLoading(true);

    const taskData: Task = {
      id: initialTask?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      gitIssueUrl: gitIssueUrl.trim() || undefined,
      assigneeId: assigneeId || undefined,
      startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
      dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
      priority,
      status,
      product,
      taskType,
      notes: notes.trim() || undefined,
    };
    
    try {
      await onSubmit(taskData);
      onClose(); // Close form on successful submission
    } catch (err: any) {
      console.error("Failed to submit task:", err);
      // 顯示詳細錯誤訊息
      setError(err?.message || String(err) || "提交任務失敗，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150 ease-in-out text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {initialTask ? '編輯任務' : '建立新任務'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors duration-150"
            aria-label="關閉表單"
          >
            &times;
          </button>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className={labelClass}>標題 <span className="text-red-500">*</span></label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>詳細說明</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputClass} min-h-[80px]`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <label htmlFor="gitIssueUrl" className={labelClass}>Git Issue 連結</label>
              <input type="url" id="gitIssueUrl" value={gitIssueUrl} placeholder="https://github.com/user/repo/issues/1" onChange={(e) => setGitIssueUrl(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="assigneeId" className={labelClass}>負責人</label>
              <select id="assigneeId" value={assigneeId || ''} onChange={(e) => setAssigneeId(e.target.value || undefined)} className={inputClass}>
                <option value="">未分配</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.displayName}</option>
                ))}
              </select>
            </div>
          
            <div>
              <label htmlFor="startDate" className={labelClass}>開始日期</label>
              <input type="date" id="startDate" value={startDate || ''} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="dueDate" className={labelClass}>截止日期</label>
              <input type="date" id="dueDate" value={dueDate || ''} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
          
            <div>
              <label htmlFor="priority" className={labelClass}>優先級 <span className="text-red-500">*</span></label>
              <select id="priority" value={priority} onChange={e => setPriority(e.target.value)} className={inputClass} required>
                <option value="" disabled>請選擇</option>
                {priorities.map(p => (
                  <option key={p.id} value={p.id}>{p.levelName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className={labelClass}>狀態 <span className="text-red-500">*</span></label>
              <select id="status" value={status} onChange={e => setStatus(e.target.value)} className={inputClass} required>
                <option value="" disabled>請選擇</option>
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.statusName}</option>
                ))}
              </select>
            </div>
          
            <div>
              <label htmlFor="product" className={labelClass}>產品 <span className="text-red-500">*</span></label>
              <select id="product" value={product} onChange={(e) => setProduct(e.target.value as Product)} className={inputClass}>
                {PRODUCT_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="taskType" className={labelClass}>任務類型 <span className="text-red-500">*</span></label>
              <select id="taskType" value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)} className={inputClass}>
                {TASK_TYPE_OPTIONS.map(tt => <option key={tt} value={tt}>{tt}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="notes" className={labelClass}>備註</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${inputClass} min-h-[60px]`} />
          </div>

          <div className="flex justify-end space-x-3 pt-5 mt-2 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading} 
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:outline-none transition duration-150 disabled:opacity-60"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (initialTask ? '儲存變更' : '建立任務')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
