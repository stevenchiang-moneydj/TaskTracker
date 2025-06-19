
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
import { Task, Member, FirebaseUser } from '../types'; // Custom FirebaseUser type

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const TASKS_COLLECTION = 'tasks';
const MEMBERS_COLLECTION = 'members';

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


export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'assigneeName'>): Promise<string> => {
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    ...taskData,
    startDate: taskData.startDate || null,
    dueDate: taskData.dueDate || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateTask = async (taskId: string, taskData: Partial<Omit<Task, 'assigneeName'>>): Promise<void> => {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  // Ensure dates are Timestamps or null
  const dataToUpdate: Partial<Task> = { ...taskData };
  if (taskData.startDate === undefined) dataToUpdate.startDate = null;
  if (taskData.dueDate === undefined) dataToUpdate.dueDate = null;
  
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
