import { Timestamp } from 'firebase/firestore';

// 狀態型別與 Firestore 對應
export interface Status {
  id: string; // documentId
  statusName: string;
  statusNumber: number;
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
  priority: string; // priorityId
  status: string; // statusId
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
