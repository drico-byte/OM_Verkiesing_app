export type Gender = 'seun' | 'dogter';

export interface Candidate {
  id: string;
  name: string;
  gender: Gender;
  grade?: string;
  avatarUrl?: string;
}

export interface VoteRecord {
  id: string;
  voterId: string;
  selectedBoyIds: string[];
  selectedGirlIds: string[];
  timestamp: string; // ISO string
}

export interface Ballot {
  id: string;
  name: string;
  accessCode: string; // toelatingskode (case-insensitive search)
  validVoterIds: string[];
  manualVoterIds?: string[]; // Voter IDs added manually by admin
  boysCandidates: Candidate[];
  girlsCandidates: Candidate[];
  maxBoyPicks: number;
  maxGirlPicks: number;
  openTime: string; // ISO string
  closeTime: string; // ISO string
  isManualOpen: boolean; // Manual open/close override
  votes: VoteRecord[];
  createdAt: string;
}

export interface AdminSettings {
  adminPassword: string;
  schoolLogoUrl: string | null;
  schoolName: string;
}

export type ViewMode = 
  | { type: 'app_landing' }
  | { type: 'admin_landing' }
  | { type: 'admin_ballot_detail'; ballotId: string }
  | { type: 'learner_ballot_landing'; ballotId: string }
  | { type: 'learner_voting'; ballotId: string; voterId: string };
