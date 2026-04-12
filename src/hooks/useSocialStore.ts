import { create } from 'zustand';

interface SocialStore {
  feed: any[];
  setFeed: (posts: any[]) => void;
  updatePost: (postId: string, updates: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useSocialStore = create<SocialStore>((set) => ({
  feed: [],
  setFeed: (posts) => set({ feed: posts }),
  updatePost: (postId, updates) => 
    set((state) => ({
      feed: state.feed.map((post) => 
        post.id === postId ? { ...post, ...updates } : post
      ),
    })),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
