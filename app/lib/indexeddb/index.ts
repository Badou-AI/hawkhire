import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the resume match document type
export interface ResumeMatchDocument {
  id: string;
  item_data?: {
    content?: {
      profile?: {
        first_name?: string;
        last_name?: string;
        tel_num?: string;
        email?: string;
      };
      title?: string;
      years_of_experience?: number;
      summary?: string;
      skills?: Array<{
        skill: string;
        score: number;
      }>;
      topics?: string[];
    };
    matching_score?: {
      data?: {
        justification?: {
          type: string;
          meta: {
            description: string;
          };
        };
        score?: {
          type: string;
          minimum: number;
          maximum: number;
          meta: {
            description: string;
          };
          value: number;
        };
      };
    };
    file_info?: {
      name: string;
      size: number;
      mime_type: string;
      processed_path: string;
    };
    timestamp?: string;
  };
}

// Define the resume matches response type
export interface ResumeMatchesResponse {
  documents: ResumeMatchDocument[];
  total: number;
}

// Define the cached resume matches type
export interface CachedResumeMatches {
  jobId: string;
  documents: ResumeMatchDocument[];
  total: number;
  lastSynced: number;
  lastFetched: number;
}

// Define the database schema
interface HawkHireDB extends DBSchema {
  'resume-matches': {
    key: string; // This will be the job ID
    value: CachedResumeMatches;
    indexes: {
      'by-job': string; // Index by job ID
    };
  }
}

// Database version
const DB_VERSION = 1;
// Database name
const DB_NAME = 'hawkhire-db';

// Initialize the database
export async function initDB(): Promise<IDBPDatabase<HawkHireDB>> {
  return openDB<HawkHireDB>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<HawkHireDB>) {
      // Create the resume-matches object store if it doesn't exist
      if (!db.objectStoreNames.contains('resume-matches')) {
        const store = db.createObjectStore('resume-matches', { keyPath: 'jobId' });
        store.createIndex('by-job', 'jobId');
      }
    },
  });
}

// Get resume matches for a job
export async function getResumeMatches(jobId: string): Promise<CachedResumeMatches | undefined> {
  const db = await initDB();
  const matches = await db.get('resume-matches', jobId);
  return matches;
}

// Save resume matches for a job
export async function saveResumeMatches(jobId: string, data: ResumeMatchesResponse): Promise<void> {
  const db = await initDB();
  const now = Date.now();
  
  await db.put('resume-matches', {
    jobId,
    documents: data.documents,
    total: data.total,
    lastSynced: now,
    lastFetched: now,
  });
}

// Check if we need to sync with the server
export async function shouldSync(jobId: string, maxAge: number = 5 * 60 * 1000): Promise<boolean> {
  const db = await initDB();
  const matches = await db.get('resume-matches', jobId);
  
  if (!matches) {
    return true; // No data, need to sync
  }
  
  const now = Date.now();
  const age = now - matches.lastSynced;
  
  return age > maxAge; // Sync if data is older than maxAge (default 5 minutes)
}

// Sync resume matches with the server
export async function syncResumeMatches(
  jobId: string, 
  fetchFn: () => Promise<ResumeMatchesResponse>,
  force: boolean = false
): Promise<CachedResumeMatches | ResumeMatchesResponse> {
  // If force is true, always fetch from server
  // Otherwise, check if we need to sync
  if (!force) {
    const needsSync = await shouldSync(jobId);
    if (!needsSync) {
      const matches = await getResumeMatches(jobId);
      if (matches) {
        return matches;
      }
    }
  }
  
  try {
    // Fetch from server
    const data = await fetchFn();
    
    // Save to IndexedDB
    await saveResumeMatches(jobId, data);
    
    // Return the data with the lastSynced and lastFetched timestamps
    const now = Date.now();
    return {
      jobId,
      documents: data.documents,
      total: data.total,
      lastSynced: now,
      lastFetched: now,
    };
  } catch (error) {
    console.error('Error syncing resume matches:', error);
    
    // If there's an error, try to return cached data
    const matches = await getResumeMatches(jobId);
    if (matches) {
      return matches;
    }
    
    // If no cached data, rethrow the error
    throw error;
  }
}

// Clear all data for a job
export async function clearResumeMatches(jobId: string): Promise<void> {
  const db = await initDB();
  await db.delete('resume-matches', jobId);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  await db.clear('resume-matches');
}

// Get all jobs with cached resume matches
export async function getAllCachedJobs(): Promise<string[]> {
  const db = await initDB();
  const keys = await db.getAllKeys('resume-matches');
  return keys;
}

// Check if the browser supports IndexedDB
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
} 