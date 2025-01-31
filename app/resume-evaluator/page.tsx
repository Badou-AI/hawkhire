"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { FileDropzone } from "@/components/resume-evaluator/FileDropzone"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FileText, Brain, TrendingUp, Target, ScrollText } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { ArrowLeft } from "lucide-react"

// Add missing interfaces at the top after imports
interface SkillAnalysis {
  skill: string
  level: "Expert" | "Proficient" | "Basic"
  score: number
  description: string
}

interface ResumeAnalysis {
  matchScore: number
  skills: SkillAnalysis[]
  feedback: {
    overview: string
    strengths: Array<{
      skill: string
      analysis: string
      relevance: string
    }>
    gaps: Array<{
      skill: string
      importance: "Critical" | "Important" | "Nice to have"
      suggestion: string
      impact: string
    }>
    improvementPlan: {
      shortTerm: string[]
      longTerm: string[]
      resumeSuggestions: string[]
    }
  }
}

// Add mock data after interfaces
const mockAnalysisData: ResumeAnalysis = {
  matchScore: 85,
  skills: [
    {
      skill: "React.js",
      level: "Expert",
      score: 90,
      description: "Strong background in building applications with React.js and implementing best practices."
    },
    {
      skill: "HTML5",
      level: "Expert",
      score: 90,
      description: "Expert in using HTML5 to create well-structured and semantic markup for web pages."
    },
    {
      skill: "JavaScript (ES6+)",
      level: "Expert",
      score: 85,
      description: "Strong command of modern JavaScript features and syntax to create interactive web applications."
    },
    {
      skill: "CSS3",
      level: "Expert",
      score: 85,
      description: "Extensive knowledge of CSS3 for styling applications and creating visually appealing user interfaces."
    },
    {
      skill: "Git",
      level: "Expert",
      score: 80,
      description: "Proficient in using Git for version control and collaboration during software development."
    },
    {
      skill: "Next.js",
      level: "Expert",
      score: 80,
      description: "Experience in developing large-scale applications using Next.js, including server-side rendering and state management."
    }
  ],
  feedback: {
    overview: "You are a strong candidate for the Full Stack Developer role with a matching score of 85%. You possess 5 years of experience in React.js and Next.js, demonstrating expertise in building scalable web applications. Your proficiency in JavaScript and TypeScript aligns with the job's essential skills.",
    strengths: [
      {
        skill: "React.js",
        analysis: "Strong background in building applications with React.js and implementing best practices. Relevance to Position: Critical",
        relevance: "Critical"
      },
      {
        skill: "Next.js",
        analysis: "Experience in developing large-scale applications with server-side rendering and static site generation.",
        relevance: "Critical"
      },
      {
        skill: "JavaScript (ES6+)",
        analysis: "Strong command of modern JavaScript features, creating interactive web applications.",
        relevance: "Important"
      }
    ],
    gaps: [
      {
        skill: "Python",
        importance: "Critical",
        suggestion: "Gain experience with Python and frameworks like FastAPI or Django.",
        impact: "Lack of backend knowledge limits your ability to work effectively in a full-stack environment."
      },
      {
        skill: "Database Technologies",
        importance: "Important",
        suggestion: "Familiarize with PostgreSQL and Redis.",
        impact: "Not having experience with these databases can hinder your ability to manage data effectively within web applications."
      },
      {
        skill: "Cloud Services",
        importance: "Nice to have",
        suggestion: "Explore AWS or GCP fundamentals.",
        impact: "Limited knowledge of cloud services may reduce efficiency in deploying and managing applications."
      }
    ],
    improvementPlan: {
      shortTerm: [
        "Enroll in a Python development course focused on FastAPI or Django",
        "Practice building RESTful APIs using Python",
        "Learn the fundamentals of PostgreSQL and Redis"
      ],
      longTerm: [
        "Gain hands-on experience with cloud services such as AWS or GCP",
        "Understand and implement CI/CD pipelines for full stack projects",
        "Explore Docker and Kubernetes for containerization and orchestration"
      ],
      resumeSuggestions: [
        "Emphasize backend programming skills and knowledge in your resume",
        "Add any projects or certifications undertaken related to Python or cloud services",
        "Highlight any courses or certifications related to database technologies"
      ]
    }
  }
}

export default function ResumeEvaluatorPage() {
  const [jobDescription, setJobDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)

  const handleFileUpload = async () => {
    if (!jobDescription) {
      // Show error about job description being required
      return
    }

    setIsAnalyzing(true)
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Use mock data instead of actual API call
      setAnalysis(mockAnalysisData)
    } catch (error) {
      console.error('Error analyzing resume:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSkillLevelColor = (level: string): string => {
    switch (level) {
      case 'Expert':
        return 'bg-green-500'
      case 'Proficient':
        return 'bg-blue-500'
      case 'Basic':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const resetAnalysis = () => {
    setAnalysis(null)
    setJobDescription("")
  }

  return (
    <div className="p-6">
      {analysis && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold">Analysis Results</h1>
          <button
            onClick={resetAnalysis}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Start New Analysis
          </button>
        </div>
      )}

      {!analysis && <h1 className="text-2xl font-bold mb-6">Resume Evaluator</h1>}

      <div className="space-y-6">
        {/* Upload and Job Description Section */}
        <div className="max-w-xl mx-auto space-y-6">
          {!analysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Upload Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileDropzone
                    onFileSelect={handleFileUpload}
                    disabled={isAnalyzing}
                    acceptedTypes={['.pdf', '.doc', '.docx']}
                    description="Upload your resume"
                    fileTypeDescription="PDF, DOC, or DOCX"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <Button 
                    className="w-full mt-4" 
                    disabled={!jobDescription || isAnalyzing}
                    onClick={handleFileUpload}
                  >
                    {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Two Column Layout for Job Description and Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 h-[600px] overflow-y-auto hide-scrollbar prose prose-sm max-w-none">
                    <ReactMarkdown>{jobDescription}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>

              {/* Combined Score and Skills Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Match Analysis</CardTitle>
                  <CardDescription>Overall match score and detailed skills breakdown</CardDescription>
                </CardHeader>
                <CardContent className="h-[600px] overflow-y-auto hide-scrollbar">
                  <div className="space-y-8">
                    {/* Score Circle */}
                    <div className="flex justify-center">
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                          <circle
                            className="text-muted stroke-current"
                            strokeWidth="10"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className="text-primary stroke-current"
                            strokeWidth="10"
                            strokeLinecap="round"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                            strokeDasharray={`${analysis.matchScore * 2.51327} 251.327`}
                            transform="rotate(-90 50 50)"
                          />
                          <text
                            x="50"
                            y="50"
                            className="text-3xl font-bold"
                            textAnchor="middle"
                            dy="0.3em"
                            fill="currentColor"
                          >
                            {analysis.matchScore}%
                          </text>
                        </svg>
                      </div>
                    </div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {analysis.skills.map((skill, index) => (
                        <Card key={index} className="border shadow-sm">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{skill.skill}</span>
                              <Badge variant="outline">{skill.level}</Badge>
                            </div>
                            <div className="h-2 rounded-full bg-secondary">
                              <div
                                className={cn("h-full rounded-full transition-all", getSkillLevelColor(skill.level))}
                                style={{ width: `${skill.score}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {skill.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Section in Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Overview Card */}
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{analysis.feedback.overview}</p>
                </CardContent>
              </Card>

              {/* Key Strengths Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Key Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.feedback.strengths.map((strength, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="font-semibold">{strength.skill}</h4>
                      <p className="text-sm">{strength.analysis}</p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Relevance:</strong> {strength.relevance}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Areas to Improve Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.feedback.gaps.map((gap, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{gap.skill}</h4>
                        <Badge>{gap.importance}</Badge>
                      </div>
                      <p className="text-sm"><strong>Impact:</strong> {gap.impact}</p>
                      <p className="text-sm"><strong>Suggestion:</strong> {gap.suggestion}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Development Plan Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Development Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Short-term Actions (1-3 Months)</h4>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        {analysis.feedback.improvementPlan.shortTerm.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Long-term Growth (3-12 Months)</h4>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        {analysis.feedback.improvementPlan.longTerm.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resume Enhancement Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ScrollText className="h-5 w-5" />
                    Resume Enhancement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 space-y-2 text-sm">
                    {analysis.feedback.improvementPlan.resumeSuggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 