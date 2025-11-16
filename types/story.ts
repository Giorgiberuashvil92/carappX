export type StoryMediaType = 'image' | 'video';

export type StoryPollOption = {
  id: string;
  label: string;
  votes: number;
};

export type StoryPoll = {
  id: string;
  question: string;
  options: StoryPollOption[];
  hasVoted?: boolean;
  selectedOptionId?: string;
};

export type StoryItem = {
  id: string;
  type: StoryMediaType;
  uri: string;
  durationMs?: number; // used for progress on images, video can hook into onProgress
  caption?: string;
  poll?: StoryPoll;
};

export type StoryAuthor = {
  id: string;
  name: string;
  avatar?: string;
};

export type Story = {
  id: string;
  author: StoryAuthor;
  createdAt: number;
  items: StoryItem[];
  highlight?: boolean;
  category?: 'my-car' | 'friends' | 'services';
};


