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
import { useSearchParams } from 'next/navigation'

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
      relevance: "Critical" | "Important" | "Critique" | "Bon à avoir"
    }>
    gaps: Array<{
      skill: string
      importance: "Critical" | "Important" | "Nice to have" | "Critique" | "Bon à avoir"
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

// Add language detection function
const detectLanguage = (text: string): string => {
  // Simple language detection based on common French words
  const frenchIndicators = ['emploi', 'poste', 'entreprise', 'société', 'développeur', 'compétences', 'expérience', 'nous recherchons', 'responsabilités']
  const lowerText = text.toLowerCase()
  
  for (const indicator of frenchIndicators) {
    if (lowerText.includes(indicator)) {
      return 'fr'
    }
  }
  
  return 'en'
}

// Add English mock data back
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

// Add French mock data
const mockAnalysisDataFr: ResumeAnalysis = {
  matchScore: 85,
  skills: [
    {
      skill: "React.js",
      level: "Expert",
      score: 90,
      description: "Solide expérience dans le développement d'applications avec React.js et l'implémentation des meilleures pratiques."
    },
    {
      skill: "HTML5",
      level: "Expert",
      score: 90,
      description: "Expert en utilisation de HTML5 pour créer des structures web sémantiques et bien organisées."
    },
    {
      skill: "JavaScript (ES6+)",
      level: "Expert",
      score: 85,
      description: "Maîtrise des fonctionnalités modernes de JavaScript pour créer des applications web interactives."
    },
    {
      skill: "CSS3",
      level: "Expert",
      score: 85,
      description: "Connaissance approfondie de CSS3 pour le style et la création d'interfaces utilisateur attrayantes."
    },
    {
      skill: "Git",
      level: "Expert",
      score: 80,
      description: "Maîtrise de Git pour le contrôle de version et la collaboration pendant le développement."
    },
    {
      skill: "Next.js",
      level: "Expert",
      score: 80,
      description: "Expérience dans le développement d'applications à grande échelle avec Next.js, y compris le rendu côté serveur."
    }
  ],
  feedback: {
    overview: "Vous êtes un excellent candidat pour le poste de Développeur Full Stack avec un score de correspondance de 85%. Vous possédez 5 ans d'expérience en React.js et Next.js, démontrant une expertise dans la création d'applications web évolutives. Votre maîtrise de JavaScript et TypeScript correspond aux compétences essentielles du poste.",
    strengths: [
      {
        skill: "React.js",
        analysis: "Solide expérience dans le développement d'applications avec React.js et l'implémentation des meilleures pratiques.",
        relevance: "Critique"
      },
      {
        skill: "Next.js",
        analysis: "Expérience dans le développement d'applications à grande échelle avec rendu côté serveur.",
        relevance: "Critique"
      },
      {
        skill: "JavaScript (ES6+)",
        analysis: "Maîtrise des fonctionnalités JavaScript modernes pour créer des applications interactives.",
        relevance: "Important"
      }
    ],
    gaps: [
      {
        skill: "Python",
        importance: "Critique",
        suggestion: "Acquérir de l'expérience avec Python et les frameworks comme FastAPI ou Django.",
        impact: "Le manque de connaissances backend limite votre capacité à travailler efficacement dans un environnement full-stack."
      },
      {
        skill: "Technologies de Base de Données",
        importance: "Important",
        suggestion: "Se familiariser avec PostgreSQL et Redis.",
        impact: "Le manque d'expérience avec ces bases de données peut limiter votre capacité à gérer efficacement les données."
      },
      {
        skill: "Services Cloud",
        importance: "Bon à avoir",
        suggestion: "Explorer les fondamentaux d'AWS ou GCP.",
        impact: "Une connaissance limitée des services cloud peut réduire l'efficacité dans le déploiement."
      }
    ],
    improvementPlan: {
      shortTerm: [
        "S'inscrire à un cours de développement Python axé sur FastAPI ou Django",
        "Pratiquer la création d'APIs RESTful avec Python",
        "Apprendre les fondamentaux de PostgreSQL et Redis"
      ],
      longTerm: [
        "Acquérir de l'expérience pratique avec les services cloud AWS ou GCP",
        "Comprendre et mettre en œuvre des pipelines CI/CD pour les projets full stack",
        "Explorer Docker et Kubernetes pour la conteneurisation"
      ],
      resumeSuggestions: [
        "Mettre en avant les compétences en programmation backend dans votre CV",
        "Ajouter des projets ou certifications liés à Python ou aux services cloud",
        "Souligner les formations ou certifications liées aux technologies de base de données"
      ]
    }
  }
}

export default function ResumeEvaluatorPage() {
  const searchParams = useSearchParams()
  const [jobDescription, setJobDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const useMockData = searchParams.get('mock') === 'true'

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file)
  }

  const handleAnalyzeClick = async () => {
    if (!selectedFile || !jobDescription) {
      return
    }

    setIsAnalyzing(true)
    
    try {
      if (useMockData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Use mock data based on detected language
        const language = detectLanguage(jobDescription)
        setAnalysis(language === 'fr' ? mockAnalysisDataFr : mockAnalysisData)
      } else {
        // Use the existing working API endpoint
        const formData = new FormData()
        formData.append('resume', selectedFile)
        formData.append('job_description', jobDescription)
        formData.append('existing_job_id', '')
        formData.append('exclude_fields', 'embedding')

        const response = await fetch('/api/analyze-resume', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Failed to analyze resume')
        }

        const result = await response.json()
        setAnalysis(result)
      }
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
    setSelectedFile(null)
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
                  {selectedFile && (
                    <CardDescription>
                      Selected file: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <FileDropzone
                    onFileSelect={handleFileUpload}
                    disabled={isAnalyzing}
                    acceptedTypes={['.pdf', '.doc', '.docx']}
                    description={selectedFile ? "Click to change file" : "Upload your resume"}
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
                    disabled={!jobDescription || !selectedFile || isAnalyzing}
                    onClick={handleAnalyzeClick}
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
