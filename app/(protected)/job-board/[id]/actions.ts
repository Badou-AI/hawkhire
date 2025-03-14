export async function getSimilarJobs(jobId: string) {
    try {
      if (!jobId) {
        throw new Error('Job ID is required')
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
      // Use absolute URL with IPv4 address
      const response = await fetch(`${baseUrl}/api/jobs`, {})
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching similar jobs:', error)
      return []  // Return empty array on error
    }
  } 