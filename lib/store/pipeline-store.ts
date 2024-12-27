import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PipelineStage = 'phoneScreen' | 'technical' | 'cultural' | 'offer' | 'hired' | 'rejected'

interface Candidate {
  id: string
  name: string
  role: string
  score: number
  imageUrl: string
  stage?: PipelineStage
  interviewLink?: string
  scheduledTime?: string
}

interface PipelineStore {
  candidates: Record<string, Candidate>
  addCandidate: (candidate: Candidate) => void
  updateCandidateStage: (candidateId: string, stage: PipelineStage) => void
  getCandidatesByStage: (stage: PipelineStage) => Candidate[]
}

// Mock candidates data
const mockCandidates: Record<string, Candidate> = {
  // Phone Screen Stage (8 candidates)
  '1': {
    id: '1',
    name: 'Sarah Miller',
    role: 'Full Stack Developer',
    score: 95,
    imageUrl: '/placeholder.svg',
    stage: 'phoneScreen'
  },
  '2': {
    id: '2',
    name: 'James Wilson',
    role: 'Frontend Developer',
    score: 92,
    imageUrl: '/placeholder.svg',
    stage: 'technical'
  },
  '3': {
    id: '3',
    name: 'Michael Chen',
    role: 'DevOps Engineer',
    score: 88,
    imageUrl: '/placeholder.svg',
    stage: 'cultural'
  },
  '4': {
    id: '4',
    name: 'Emma Thompson',
    role: 'UI/UX Designer',
    score: 91,
    imageUrl: '/placeholder.svg',
    stage: 'offer'
  },
  '5': {
    id: '5',
    name: 'Lucas Rodriguez',
    role: 'Backend Developer',
    score: 87,
    imageUrl: '/placeholder.svg',
    stage: 'offer'
  },
  '6': {
    id: '6',
    name: 'Sophia Lee',
    role: 'Data Engineer',
    score: 89,
    imageUrl: '/placeholder.svg',
    stage: 'rejected'
  },
  '7': {
    id: '7',
    name: 'Oliver Brown',
    role: 'Mobile Developer',
    score: 86,
    imageUrl: '/placeholder.svg',
    stage: 'cultural'
  },
  '8': {
    id: '8',
    name: 'Isabella Garcia',
    role: 'Full Stack Developer',
    score: 90,
    imageUrl: '/placeholder.svg',
    stage: 'technical'
  },

  // Technical Interview Stage (7 candidates)
  '9': {
    id: '9',
    name: 'William Taylor',
    role: 'Backend Developer',
    score: 94,
    imageUrl: '/placeholder.svg',
    stage: 'offer',
    scheduledTime: 'Tomorrow at 2:00 PM',
    interviewLink: 'meet.google.com/abc-defg-hij'
  },
  '10': {
    id: '10',
    name: 'Ava Martinez',
    role: 'Frontend Developer',
    score: 93,
    imageUrl: '/placeholder.svg',
    stage: 'technical',
    scheduledTime: 'Today at 4:30 PM',
    interviewLink: 'meet.google.com/xyz-uvw-rst'
  },
  '11': {
    id: '11',
    name: 'Henry Johnson',
    role: 'Full Stack Developer',
    score: 88,
    imageUrl: '/placeholder.svg',
    stage: 'technical',
    scheduledTime: 'Tomorrow at 11:00 AM'
  },
  '12': {
    id: '12',
    name: 'Mia Anderson',
    role: 'DevOps Engineer',
    score: 87,
    imageUrl: '/placeholder.svg',
    stage: 'technical',
    scheduledTime: 'Friday at 3:00 PM'
  },
  '13': {
    id: '13',
    name: 'Alexander White',
    role: 'Mobile Developer',
    score: 89,
    imageUrl: '/placeholder.svg',
    stage: 'technical'
  },
  '14': {
    id: '14',
    name: 'Charlotte Davis',
    role: 'UI/UX Designer',
    score: 92,
    imageUrl: '/placeholder.svg',
    stage: 'technical'
  },
  '15': {
    id: '15',
    name: 'Daniel Kim',
    role: 'Data Engineer',
    score: 90,
    imageUrl: '/placeholder.svg',
    stage: 'technical'
  },

  // Cultural Fit Stage (6 candidates)
  '16': {
    id: '16',
    name: 'Emily Wilson',
    role: 'Full Stack Developer',
    score: 95,
    imageUrl: '/placeholder.svg',
    stage: 'cultural',
    scheduledTime: 'Next Monday at 2:00 PM'
  },
  '17': {
    id: '17',
    name: 'Benjamin Moore',
    role: 'Backend Developer',
    score: 91,
    imageUrl: '/placeholder.svg',
    stage: 'cultural',
    scheduledTime: 'Wednesday at 11:30 AM'
  },
  '18': {
    id: '18',
    name: 'Sofia Patel',
    role: 'Frontend Developer',
    score: 88,
    imageUrl: '/placeholder.svg',
    stage: 'cultural'
  },
  '19': {
    id: '19',
    name: 'Jack Thompson',
    role: 'DevOps Engineer',
    score: 87,
    imageUrl: '/placeholder.svg',
    stage: 'cultural'
  },
  '20': {
    id: '20',
    name: 'Victoria Lee',
    role: 'UI/UX Designer',
    score: 93,
    imageUrl: '/placeholder.svg',
    stage: 'cultural'
  },
  '21': {
    id: '21',
    name: 'Sebastian Cruz',
    role: 'Mobile Developer',
    score: 89,
    imageUrl: '/placeholder.svg',
    stage: 'cultural'
  },

  // Offer Stage (4 candidates)
  '22': {
    id: '22',
    name: 'Olivia Brown',
    role: 'Full Stack Developer',
    score: 96,
    imageUrl: '/placeholder.svg',
    stage: 'offer'
  },
  '23': {
    id: '23',
    name: 'Liam Johnson',
    role: 'Backend Developer',
    score: 94,
    imageUrl: '/placeholder.svg',
    stage: 'offer'
  },
  '24': {
    id: '24',
    name: 'Emma Davis',
    role: 'Frontend Developer',
    score: 92,
    imageUrl: '/placeholder.svg',
    stage: 'offer'
  },
  '25': {
    id: '25',
    name: 'Noah Wilson',
    role: 'DevOps Engineer',
    score: 93,
    imageUrl: '/placeholder.svg',
    stage: 'offer'
  },

  // Hired Stage (4 candidates)
  '26': {
    id: '26',
    name: 'Sophia Martinez',
    role: 'Full Stack Developer',
    score: 97,
    imageUrl: '/placeholder.svg',
    stage: 'hired',
    scheduledTime: 'Starts Feb 1st, 2024'
  },
  '27': {
    id: '27',
    name: 'Lucas Anderson',
    role: 'Backend Developer',
    score: 95,
    imageUrl: '/placeholder.svg',
    stage: 'hired',
    scheduledTime: 'Starts Jan 15th, 2024'
  },
  '28': {
    id: '28',
    name: 'Ava Taylor',
    role: 'UI/UX Designer',
    score: 94,
    imageUrl: '/placeholder.svg',
    stage: 'hired',
    scheduledTime: 'Starts Feb 5th, 2024'
  },
  '29': {
    id: '29',
    name: 'Mason Garcia',
    role: 'DevOps Engineer',
    score: 96,
    imageUrl: '/placeholder.svg',
    stage: 'hired',
    scheduledTime: 'Starts Jan 22nd, 2024'
  },

  // Rejected Stage (3 candidates)
  '30': {
    id: '30',
    name: 'Ethan Moore',
    role: 'Frontend Developer',
    score: 82,
    imageUrl: '/placeholder.svg',
    stage: 'rejected'
  },
  '31': {
    id: '31',
    name: 'Chloe Wilson',
    role: 'Mobile Developer',
    score: 78,
    imageUrl: '/placeholder.svg',
    stage: 'rejected'
  },
  '32': {
    id: '32',
    name: 'Jackson Lee',
    role: 'Data Engineer',
    score: 80,
    imageUrl: '/placeholder.svg',
    stage: 'rejected'
  }
}

// Initial state to prevent hydration mismatches
const initialState: Pick<PipelineStore, 'candidates'> = {
  candidates: mockCandidates
}

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      addCandidate: (candidate) =>
        set((state) => ({
          candidates: {
            ...state.candidates,
            [candidate.id]: { ...candidate, stage: 'phoneScreen' }
          }
        })),
      updateCandidateStage: (candidateId, stage) =>
        set((state) => ({
          candidates: {
            ...state.candidates,
            [candidateId]: { ...state.candidates[candidateId], stage }
          }
        })),
      getCandidatesByStage: (stage) => {
        const { candidates } = get()
        return Object.values(candidates).filter(c => c.stage === stage)
      }
    }),
    {
      name: 'pipeline-storage',
      skipHydration: true // Add this to prevent hydration mismatches
    }
  )
)