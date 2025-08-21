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
}

const Index = () => {
  return <RefactoredIndex />;
};

export default Index;
