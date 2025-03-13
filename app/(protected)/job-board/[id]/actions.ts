export async function getSimilarJobs(jobId: string) {
    try {
      if (!jobId) {
        throw new Error('Job ID is required')
      }
      // Use absolute URL with IPv4 address
      const response = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/api/jobs`, {
        headers: {
          'Host': '127.0.0.1'
        }
      })
  
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