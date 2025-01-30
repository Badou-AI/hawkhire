'use client'

import { useState } from 'react'
import { ResumeUpload } from '@/components/resume-evaluator/ResumeUpload'
import { JobDescriptionInput } from '@/components/resume-evaluator/JobDescriptionInput'
import { MatchScore } from '@/components/resume-evaluator/AnalysisResults/MatchScore'
import { SkillsBreakdown } from '@/components/resume-evaluator/AnalysisResults/SkillsBreakdown'
import { FeedbackView } from '@/components/resume-evaluator/AnalysisResults/FeedbackView'
import { mockResponse } from './mock-response'

export default function ResumeEvaluatorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<{
    matchScore: number
    skills: Array<{ skill: string; score: number; justification: string }>
    feedback: string
  } | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setAnalysisResults(null)
  }

  const handleDescriptionChange = (description: string) => {
    setJobDescription(description)
  }

  const handleAnalyze = async () => {
    if (!selectedFile || !jobDescription) return

    setIsLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Use mock data instead of API call
      setAnalysisResults({
        matchScore: mockResponse.matching_score.data.score.meta.value,
        skills: mockResponse.content.data.skills,
        feedback: mockResponse.feedback.content
      })
    } catch (error) {
      console.error('Error analyzing resume:', error)
      // Handle error appropriately
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">Resume Evaluator</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <ResumeUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFile={selectedFile}
            isLoading={isLoading}
          />

          <JobDescriptionInput
            onDescriptionChange={handleDescriptionChange}
            value={jobDescription}
            isLoading={isLoading}
          />

          <button
            className="w-full px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAnalyze}
            disabled={!selectedFile || !jobDescription || isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>

        {(analysisResults || isLoading) && (
          <div className="space-y-6">
            <MatchScore
              score={analysisResults?.matchScore || 0}
              justification="Based on skills and experience match"
              isLoading={isLoading}
            />

            <SkillsBreakdown
              skills={analysisResults?.skills || []}
              isLoading={isLoading}
            />

            <FeedbackView
              content={analysisResults?.feedback || ''}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
} 