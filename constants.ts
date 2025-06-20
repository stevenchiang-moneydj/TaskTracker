import { Status, Product, TaskType } from './types';

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBWaGYQIE58c4F8FhWWQI50eNYXkmKVT2c", // This should ideally be in environment variables
  authDomain: "tasktrack-2aa16.firebaseapp.com",
  projectId: "tasktrack-2aa16",
  storageBucket: "tasktrack-2aa16.appspot.com", // Corrected storage bucket domain
  messagingSenderId: "528031680125",
  appId: "1:528031680125:web:632ca13410467e15979314"
};

// Example admin UIDs - in a real app, this would be managed more robustly
// For this example, any logged-in user is treated as admin for task management.
// export const ADMIN_UIDS = ['SOME_ADMIN_USER_ID'];

// export const PRIORITY_OPTIONS = [Priority.HIGH, Priority.MEDIUM, Priority.LOW]; // 移除，改用 getPriorities 取得
export const STATUS_OPTIONS = [Status.TO_BE_ARRANGED, Status.IN_PROGRESS, Status.TESTING, Status.TO_MERGE, Status.DONE];
export const PRODUCT_OPTIONS = [Product.XQ, Product.XQNEXT, Product.XT];
export const TASK_TYPE_OPTIONS = [TaskType.SPEC, TaskType.BUG, TaskType.GENERAL_TEST, TaskType.DOCUMENT, TaskType.CUSTOMER_SUPPORT];

export const APP_TITLE = "團隊任務追蹤器";
