import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  User as FirebaseUserAuth, // Alias for Firebase User type from auth module
  UserCredential
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  Timestamp, 
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../constants';
import { Task, Member, FirebaseUser, Status, Product, TaskType } from '../types'; // 加入 TaskType

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const TASKS_COLLECTION = 'tasks';
const MEMBERS_COLLECTION = 'members';
const STATUS_COLLECTION = 'status';

// Authentication
export const onAuthUserChanged = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, (authUser: FirebaseUserAuth | null) => {
    if (authUser) {
      // Map FirebaseUserAuth to our custom FirebaseUser type
      callback({ uid: authUser.uid, email: authUser.email, displayName: authUser.displayName });
    } else {
      callback(null);
    }
  });
};

export const signIn = async (email: string, password: string): Promise<FirebaseUserAuth> => {
  const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user; // Return the User object from UserCredential
};

export const signOut = (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Firestore - Members
export const getMembers = async (): Promise<Member[]> => {
  const membersSnapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
  return membersSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Member));
};

// Firestore - Tasks
export const onTasksSnapshot = (
  callback: (tasks: Task[], members: Member[]) => void,
  onError: (error: Error) => void
) => {
  const tasksQuery = query(collection(db, TASKS_COLLECTION), orderBy('createdAt', 'desc'));
  
  return onSnapshot(tasksQuery, async (querySnapshot) => {
    const tasks = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Task));
    try {
      const members = await getMembers(); // Fetch members to map assignee names
      const tasksWithAssigneeNames = tasks.map(task => {
        const assignee = members.find(m => m.id === task.assigneeId);
        return { ...task, assigneeName: assignee?.displayName || (task.assigneeId ? '未知用戶' : '未分配') };
      });
      callback(tasksWithAssigneeNames, members);
    } catch (error) {
      onError(error as Error);
      callback(tasks, []); // Fallback with tasks but no member mapping
    }
  }, onError);
};

// 取得所有優先級（priority）
export type Priority = {
  id: string; // document id
  levelName: string;
  levelNumber: number;
};

export const getPriorities = async (): Promise<Priority[]> => {
  const prioritiesSnapshot = await getDocs(query(collection(db, 'priority'), orderBy('levelNumber', 'asc')));
  return prioritiesSnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Priority, 'id'>)
  }));
};

// 取得所有狀態，依 statusNumber 排序
export const getStatuses = async (): Promise<Status[]> => {
  const q = query(collection(db, STATUS_COLLECTION), orderBy('statusNumber'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Status, 'id'>)
  }));
};

// 取得所有產品，依 productNumber 排序
export const getProducts = async (): Promise<Product[]> => {
  const productsSnapshot = await getDocs(query(collection(db, 'product'), orderBy('productNumber', 'asc')));
  return productsSnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Product, 'id'>)
  }));
};

// 取得所有任務類型，依 taskTypeNumber 排序
export const getTaskTypes = async (): Promise<TaskType[]> => {
  const taskTypeSnapshot = await getDocs(query(collection(db, 'taskType'), orderBy('typeNumber', 'asc')));
  return taskTypeSnapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<TaskType, 'id'>)
  }));
};

// 定義 TaskInput 型別，priority/status/product/taskType 均為 id
export type TaskInput = {
  title: string;
  description?: string;
  gitIssueUrl?: string;
  assigneeId?: string;
  startDate?: Timestamp | null;
  dueDate?: Timestamp | null;
  priority: string; // priorityId
  status: string; // statusId
  product: string; // productId
  taskType: string; // taskTypeId
  notes?: string;
};

// 建立任務
export const createTask = async (taskData: TaskInput): Promise<string> => {
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    title: taskData.title,
    description: taskData.description || '',
    gitIssueUrl: taskData.gitIssueUrl || '',
    assigneeId: taskData.assigneeId || '',
    startDate: taskData.startDate || null,
    dueDate: taskData.dueDate || null,
    priority: taskData.priority,
    status: taskData.status,
    product: taskData.product,
    taskType: taskData.taskType,
    notes: taskData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateTask = async (taskId: string, taskData: Partial<Omit<Task, 'assigneeName'>>): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  // 將 undefined 欄位轉為空字串或 null，避免 Firestore 拋錯
  const dataToUpdate: Partial<Task> = { ...taskData };
  if (dataToUpdate.description === undefined) dataToUpdate.description = '';
  if (dataToUpdate.gitIssueUrl === undefined) dataToUpdate.gitIssueUrl = '';
  if (dataToUpdate.assigneeId === undefined) dataToUpdate.assigneeId = '';
  if (dataToUpdate.startDate === undefined) dataToUpdate.startDate = null;
  if (dataToUpdate.dueDate === undefined) dataToUpdate.dueDate = null;
  if (dataToUpdate.notes === undefined) dataToUpdate.notes = '';

  await updateDoc(taskRef, {
    ...dataToUpdate,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(taskRef);
};

export { Timestamp }; // Export Timestamp for use in components
