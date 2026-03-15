import { RefactoredIndex } from '@/components/RefactoredIndex';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string;
  x: number;
  y: number;
  size: number;
  color: string;
  accessCount: number;
  lastAccessed?: number; // Unix timestamp of last access
  accessHistory?: number[]; // Array of Unix timestamps for each access
  sharedBy?: string[]; // Names/identifiers of people who shared this
}

const Index = () => {
  return <RefactoredIndex />;
};

export default Index;
