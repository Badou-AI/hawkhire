import { z } from 'zod'

export const jobIdSchema = z.object({
  id: z.string().min(1)
}) 