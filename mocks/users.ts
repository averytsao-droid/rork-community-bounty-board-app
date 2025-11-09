import { User } from '@/types';

export const currentUser: User = {
  id: 'current-user',
  name: 'Alex Morgan',
  avatar: 'https://i.pravatar.cc/150?img=33',
  bio: 'Full-stack developer passionate about building great products. Specialized in React, Node.js, and cloud architecture.',
  bountiesPosted: 8,
  bountiesCompleted: 24,
  totalEarned: 12500,
  rating: 4.8,
  joinedDate: new Date('2024-03-15'),
  credits: 1000,
};
