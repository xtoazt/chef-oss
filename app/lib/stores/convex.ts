import { atom } from 'nanostores';

type ConvexProject = {
  token: string;
  deploymentName: string;
  deploymentUrl: string;
};

export const convexStore = atom<ConvexProject | null>(null);
