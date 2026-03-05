import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Prompt, Engagement, Deliverable, Document, ChatMessage, User } from './types';

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Prompts
  prompts: Prompt[];
  addPrompt: (prompt: Prompt) => void;
  updatePrompt: (id: string, prompt: Partial<Prompt>) => void;
  deletePrompt: (id: string) => void;
  getPromptById: (id: string) => Prompt | undefined;
  
  // Engagements
  engagements: Engagement[];
  addEngagement: (engagement: Engagement) => void;
  updateEngagement: (id: string, engagement: Partial<Engagement>) => void;
  deleteEngagement: (id: string) => void;
  getEngagementById: (id: string) => Engagement | undefined;
  
  // Deliverables
  deliverables: Deliverable[];
  addDeliverable: (deliverable: Deliverable) => void;
  updateDeliverable: (id: string, deliverable: Partial<Deliverable>) => void;
  deleteDeliverable: (id: string) => void;
  
  // Documents
  documents: Document[];
  addDocument: (document: Document) => void;
  deleteDocument: (id: string) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      user: {
        id: '1',
        name: 'Ravi Consultant',
        email: 'ravi@consulting.com',
        role: 'admin',
      },
      setUser: (user) => set({ user }),
      
      // Prompts
      prompts: [],
      addPrompt: (prompt) => set((state) => ({ prompts: [...state.prompts, prompt] })),
      updatePrompt: (id, updates) => set((state) => ({
        prompts: state.prompts.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)),
      })),
      deletePrompt: (id) => set((state) => ({
        prompts: state.prompts.filter((p) => p.id !== id),
      })),
      getPromptById: (id) => get().prompts.find((p) => p.id === id),
      
      // Engagements
      engagements: [],
      addEngagement: (engagement) => set((state) => ({ engagements: [...state.engagements, engagement] })),
      updateEngagement: (id, updates) => set((state) => ({
        engagements: state.engagements.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e)),
      })),
      deleteEngagement: (id) => set((state) => ({
        engagements: state.engagements.filter((e) => e.id !== id),
      })),
      getEngagementById: (id) => get().engagements.find((e) => e.id === id),
      
      // Deliverables
      deliverables: [],
      addDeliverable: (deliverable) => set((state) => ({ deliverables: [...state.deliverables, deliverable] })),
      updateDeliverable: (id, updates) => set((state) => ({
        deliverables: state.deliverables.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d)),
      })),
      deleteDeliverable: (id) => set((state) => ({
        deliverables: state.deliverables.filter((d) => d.id !== id),
      })),
      
      // Documents
      documents: [],
      addDocument: (document) => set((state) => ({ documents: [...state.documents, document] })),
      deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      })),
      
      // Chat
      chatMessages: [],
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      clearChat: () => set({ chatMessages: [] }),
    }),
    {
      name: 'ravi-ai-storage',
    }
  )
);
