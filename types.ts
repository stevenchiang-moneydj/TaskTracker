import { Timestamp } from 'firebase/firestore';

export enum Priority {
  HIGH = "高",
  MEDIUM = "中",
  LOW = "低",
}

export enum Status {
  IN_PROGRESS = "進行中",
  DONE = "已完成",
  TESTING = "測試中",
  TO_BE_ARRANGED = "待安排",
  TO_MERGE = "待Merge",
}

export enum Product {
  XQ = "XQ",
  XQNEXT = "XQNext",
  XT = "XT",
}

export enum TaskType {
  SPEC = "Spec",
  BUG = "Bug",
  GENERAL_TEST = "普測",
  DOCUMENT = "文件",
  CUSTOMER_SUPPORT = "客服信件",
}

export interface Member {
  id: string;
  displayName: string;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  gitIssueUrl?: string;
  assigneeId?: string;
  assigneeName?: string; // For display purposes, denormalized or fetched
  startDate?: Timestamp | null;
  dueDate?: Timestamp | null;
  priority: Priority;
  status: Status;
  product: Product;
  taskType: TaskType;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}
