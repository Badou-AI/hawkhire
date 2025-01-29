import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import JobDetails from './job-details';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function JobPage({ 
  params,
}: PageProps) {
  const supabase = createClient()
  const id = await Promise.resolve(params.id)
  
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      organization:organizations (
        name,
        id,
        logo_url,
        slug
      )
    `)
    .eq('id', id)
    .single()

  if (error || !job) {
    notFound()
  }

  return <JobDetails job={job} />
} 