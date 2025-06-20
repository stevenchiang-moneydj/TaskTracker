import { Timestamp } from 'firebase/firestore';

// 狀態型別與 Firestore 對應
export interface Status {
  id: string; // documentId
  statusName: string;
  statusNumber: number;
}

// export enum Product {
//   XQ = "XQ",
//   XQNEXT = "XQNext",
//   XT = "XT",
// }

export interface Product {
  id: string; // documentId
  productName: string;
  productNumber: number;
}

export interface TaskType {
  id: string; // documentId
  typeName: string;
  typeNumber: number;
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
  product: string; // productId
  taskType: string; // taskTypeId
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}
