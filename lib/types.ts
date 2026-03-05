// Types for Ravi AI

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface PromptVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required: boolean;
  options?: string[];
  default?: string;
  description?: string;
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  category: string;
  tags: string[];
  engagementId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Engagement {
  id: string;
  name: string;
  client: string;
  sector?: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
  deliverables: string[];
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type DeliverableStatus = 'draft' | 'in-review' | 'delivered' | 'archived';

export interface Deliverable {
  id: string;
  title: string;
  type: 'SLIDES' | 'REPORT' | 'TABLE' | 'MATRIX' | 'PLAN' | 'PROPOSAL' | 'CHARTER';
  status: DeliverableStatus;
  content: string;
  engagementId?: string;
  promptId?: string;
  qualityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType = 
  | 'AUDIT_MANUAL' 
  | 'ERM_POLICY' 
  | 'RFP' 
  | 'PRIOR_REPORT' 
  | 'GOVERNANCE_CHARTER' 
  | 'REGULATORY' 
  | 'OTHER';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileSize: number;
  content?: string;
  isIndexed: boolean;
  engagementId?: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    documentName: string;
    content: string;
    similarity: number;
  }[];
  createdAt: Date;
}
