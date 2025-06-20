import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom'; // Removed Routes, Route as they are not used for SPA without path changes
import Navbar from './components/Navbar';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import ConfirmationModal from './components/ConfirmationModal';
import LoadingSpinner from './components/LoadingSpinner';
import TaskDetailModal from './components/TaskDetailModal';
import { useAuth } from './hooks/useAuth';
import { Task, Member, Status as StatusType } from './types';
import { Priority, getStatuses } from './services/firebase';
import { 
  onTasksSnapshot, 
  createTask as apiCreateTask, 
  updateTask as apiUpdateTask, 
  deleteTask as apiDeleteTask,
  getMembers,
  getPriorities,
  Timestamp // <--- 加入 Timestamp
} from './services/firebase';

const App: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth(); // Destructure user for potential display
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [statuses, setStatuses] = useState<StatusType[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [filterAssigneeId, setFilterAssigneeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    setIsLoadingTasks(true);
    const unsubscribeTasks = onTasksSnapshot(
      (fetchedTasks, fetchedMembers) => {
        setTasks(fetchedTasks);
        setMembers(fetchedMembers); 
        setIsLoadingTasks(false);
        setError(null); // Clear error on successful fetch
      },
      (err) => {
        console.error("Error fetching tasks or members:", err);
        setError("無法載入任務資料，請檢查您的網路連線或稍後再試。");
        setIsLoadingTasks(false);
      }
    );
  
    const fetchInitialMembers = async () => {
      if (members.length === 0) { // Fetch only if members aren't already populated
        try {
          const initialMembers = await getMembers();
          setMembers(initialMembers);
        } catch (err) {
          console.error("Error fetching initial members:", err);
          // Potentially set a specific error for members if critical
        }
      }
    };
    fetchInitialMembers();

    getPriorities().then(setPriorities).catch(err => {
      console.error('載入優先級失敗', err);
      setPriorities([]);
    });
    getStatuses().then(setStatuses).catch(err => {
      console.error('載入狀態失敗', err);
      setStatuses([]);
    });

    return () => {
      unsubscribeTasks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  const handleOpenCreateTaskForm = () => {
    if (!isAdmin) {
      setError("只有管理員可以建立任務。"); // Or handle this more gracefully
      return;
    }
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleOpenEditTaskForm = (task: Task) => {
     if (!isAdmin) {
      setError("只有管理員可以編輯任務。");
      return;
    }
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleSubmitTaskForm = async (taskData: Task) => {
    setError(null);
    try {
      // Remove assigneeName before sending to Firestore as it's a derived field
      const { assigneeName, ...taskToSubmit } = taskData;

      if (editingTask && editingTask.id) {
        await apiUpdateTask(editingTask.id, taskToSubmit);
      } else {
        await apiCreateTask(taskToSubmit as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assigneeName'>);
      }
      handleCloseTaskForm();
    } catch (err) {
      console.error("Error submitting task:", err);
      setError("提交任務失敗，請檢查資料並重試。");
      throw err; 
    }
  };

  const handleDeleteTask = (taskId: string) => {
     if (!isAdmin) {
      setError("只有管理員可以刪除任務。");
      return;
    }
    setTaskToDeleteId(taskId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (taskToDeleteId) {
      setError(null);
      try {
        await apiDeleteTask(taskToDeleteId);
        setIsDeleteModalOpen(false);
        setTaskToDeleteId(null);
      } catch (err) {
        console.error("Error deleting task:", err);
        setError("刪除任務失敗。");
        setIsDeleteModalOpen(false); // Still close modal on error
      }
    }
  };

  // 快速欄位即時更新（不開啟 modal）
  const handleQuickUpdate = async (
    taskId: string,
    field: 'priority'|'assignee'|'status'|'startDate'|'dueDate',
    value: string
  ) => {
    setError(null);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      let update: Partial<Task> = {
        priority: task.priority,
        assigneeId: task.assigneeId,
        status: task.status,
        startDate: task.startDate,
        dueDate: task.dueDate,
      };
      if (field === 'priority') update.priority = value;
      if (field === 'assignee') update.assigneeId = value;
      if (field === 'status') update.status = value;
      if (field === 'startDate') {
        // value 為 'YYYY-MM-DD'，需轉為 Timestamp
        update.startDate = value ? Timestamp.fromDate(new Date(value)) : null;
      }
      if (field === 'dueDate') {
        update.dueDate = value ? Timestamp.fromDate(new Date(value)) : null;
      }
      await apiUpdateTask(taskId, update);
    } catch (err) {
      console.error('快速更新任務失敗', err);
      setError('快速更新任務失敗，請重試。');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar onCreateTask={handleOpenCreateTaskForm} />
        <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg shadow-md flex justify-between items-center">
              <span><i className="fas fa-exclamation-circle mr-2"></i>{error}</span>
              <button onClick={() => setError(null)} className="font-bold text-red-600 hover:text-red-800 text-xl">&times;</button>
            </div>
          )}
          {isLoadingTasks ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner />
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              members={members}
              onEdit={handleOpenEditTaskForm}
              onDelete={handleDeleteTask}
              filterAssigneeId={filterAssigneeId}
              setFilterAssigneeId={setFilterAssigneeId}
              isAdmin={isAdmin}
              onViewDetail={(task) => { setSelectedTask(task); setIsTaskDetailOpen(true); }}
              priorities={priorities}
              statuses={statuses}
              onQuickUpdate={handleQuickUpdate}
            />
          )}
        </main>
        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={handleCloseTaskForm}
          onSubmit={handleSubmitTaskForm}
          initialTask={editingTask}
          members={members}
          priorities={priorities}
          statuses={statuses}
        />
        <TaskDetailModal
          isOpen={isTaskDetailOpen}
          task={selectedTask}
          onClose={() => setIsTaskDetailOpen(false)}
          members={members}
          priorities={priorities}
          statuses={statuses}
        />
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          title="確認刪除任務"
          message="您確定要永久刪除此任務嗎？此操作無法復原。"
          onConfirm={confirmDeleteTask}
          onCancel={() => setIsDeleteModalOpen(false)}
          confirmButtonText="確認刪除"
        />
         <footer className="text-center py-5 bg-gray-200 text-gray-700 text-sm border-t border-gray-300">
            團隊任務追蹤器 &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
