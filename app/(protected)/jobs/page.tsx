import { JobFilters } from '@/components/jobs/job-filters'
import { JobsList } from '@/components/jobs/jobs-list'
import { JobSearchHeader } from '@/components/jobs/job-search-header'

export default function JobsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <JobSearchHeader />
      
      <div className="mt-8 flex gap-8">
        <aside className="w-64 flex-shrink-0">
          <JobFilters />
        </aside>
        
        <main className="flex-1">
          <JobsList />
        </main>
      </div>
    </div>
  )
} 