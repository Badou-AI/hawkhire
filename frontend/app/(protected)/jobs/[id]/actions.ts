export async function getSimilarJobs(jobId: string) {
  try {
    const response = await fetch(`/api/jobs/similar?jobId=${jobId}`, {
      headers: {
        'Content-Type': 'application/json'
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