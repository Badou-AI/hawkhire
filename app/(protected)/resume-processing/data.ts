// Types to match API response
interface ResumeProfile {
  first_name: string;
  last_name: string;
  tel_num: string;
  email: string;
}

interface ResumeSkill {
  skill: string;
  score: number;
}

interface OtherMatch {
  jobTitle: string;
  score: number;
}

interface ResumeContent {
  data: {
    title: string;
    profile: ResumeProfile;
    years_of_experience: number;
    summary: string;
    skills: ResumeSkill[];
    topics: string;
  }
}

interface ResumeFileInfo {
  name: string;
  size: number;
  mime_type: string;
  processed_path: string;
}

interface ResumeMatchingScore {
  data: {
    justification: {
      type: string;
      meta: {
        description: string;
      }
    };
    score: {
      type: string;
      minimum: number;
      maximum: number;
      meta: {
        description: string;
      };
      value: number;
    }
  }
}

interface ResumeDocument {
  id: string;
  item_data: {
    upload_id: string;
    job_id: string;
    timestamp: string;
    content: ResumeContent;
    file_info: ResumeFileInfo;
    matching_score: ResumeMatchingScore;
  }
}

interface ResumeResponse {
  documents: ResumeDocument[];
}

// Mock jobs data with skill requirements
export const jobs = [
  { 
    id: "1", 
    title: "Full Stack Developer",
    mainSkill: "React",
    requiredSkills: ["TypeScript", "Node.js", "PostgreSQL"]
  },
  { 
    id: "2", 
    title: "UI/UX Designer",
    mainSkill: "Figma",
    requiredSkills: ["Adobe XD", "User Research", "Prototyping"]
  },
  { 
    id: "3", 
    title: "Data Analyst",
    mainSkill: "Python",
    requiredSkills: ["SQL", "Data Visualization", "Statistics"]
  },
]

// Mock API response data
export const mockResumeResponse: ResumeResponse = {
  documents: [
    {
      id: "b935f825aecab2591b4d00018500215743c8ff680588ee9dc617e093194fe1a3",
      item_data: {
        upload_id: "1_20250127_170510_bdddc0a8",
        job_id: "1",
        timestamp: "2025-01-27T17:05:20.560295",
        content: {
          data: {
            title: "Senior Software Engineer",
            profile: {
              first_name: "Sarah",
              last_name: "Miller",
              tel_num: "+1 555-0123",
              email: "sarah.miller@example.com"
            },
            years_of_experience: 5,
            summary: "Strong expertise in React with extensive full-stack experience. Demonstrates excellent problem-solving skills and modern development practices.",
            skills: [
              { skill: "React", score: 0.98 },
              { skill: "TypeScript", score: 0.95 },
              { skill: "Node.js", score: 0.92 },
              { skill: "PostgreSQL", score: 0.88 },
              { skill: "Python", score: 0.75 },
              { skill: "AWS", score: 0.85 }
            ],
            topics: "Full Stack Development, Web Development, Cloud Architecture"
          }
        },
        file_info: {
          name: "sarah_miller_resume.pdf",
          size: 245760,
          mime_type: "application/pdf",
          processed_path: "storage/processed/1_20250127_170510_bdddc0a8/sarah_miller_resume.pdf"
        },
        matching_score: {
          data: {
            justification: {
              type: "text",
              meta: {
                description: "Excellent match with strong expertise in required technologies and proven full-stack experience."
              }
            },
            score: {
              type: "float",
              minimum: 0,
              maximum: 1,
              meta: {
                description: "score de matching entre 0 et 1"
              },
              value: 0.95
            }
          }
        }
      }
    },
    {
      id: "ffc580b4618e90fac6cde4b6d45a9c1f8cf8f35d684595ca5e9781599fc493cc",
      item_data: {
        upload_id: "1_20250127_170510_bdddc0a8",
        job_id: "1",
        timestamp: "2025-01-27T17:05:20.556235",
        content: {
          data: {
            title: "Full Stack Developer",
            profile: {
              first_name: "James",
              last_name: "Wilson",
              tel_num: "+1 555-0124",
              email: "james.wilson@example.com"
            },
            years_of_experience: 4,
            summary: "Versatile developer with strong skills in JavaScript and Python. Proven ability to adapt to new technologies and solve complex problems.",
            skills: [
              { skill: "Vue.js", score: 0.90 },
              { skill: "JavaScript", score: 0.88 },
              { skill: "Python", score: 0.85 }
            ],
            topics: "Frontend Development, JavaScript Frameworks, Backend Development"
          }
        },
        file_info: {
          name: "james_wilson_resume.pdf",
          size: 198450,
          mime_type: "application/pdf",
          processed_path: "storage/processed/1_20250127_170510_bdddc0a8/james_wilson_resume.pdf"
        },
        matching_score: {
          data: {
            justification: {
              type: "text",
              meta: {
                description: "Good match with strong JavaScript skills and adaptability, though lacking some specific required technologies."
              }
            },
            score: {
              type: "float",
              minimum: 0,
              maximum: 1,
              meta: {
                description: "score de matching entre 0 et 1"
              },
              value: 0.92
            }
          }
        }
      }
    }
  ]
};

// Helper function for skill color
export const getSkillColor = (score: number): string => {
  if (score >= 0.9) return "bg-green-500"
  if (score >= 0.8) return "bg-blue-500"
  if (score >= 0.7) return "bg-yellow-500"
  return "bg-red-500"
}

// Helper function to transform API response to UI format
export const transformApiResponseToUiFormat = (response: ResumeResponse) => {
  return response.documents.map(doc => ({
    id: doc.id,
    name: `${doc.item_data.content.data.profile.first_name} ${doc.item_data.content.data.profile.last_name}`,
    avatar: "/placeholder.svg",
    matchScore: Math.round(doc.item_data.matching_score.data.score.value * 100),
    role: doc.item_data.content.data.title,
    experience: `${doc.item_data.content.data.years_of_experience} years`,
    mainSkillScore: Math.round(doc.item_data.content.data.skills[0]?.score * 100) || 0,
    skillRatings: Object.fromEntries(
      doc.item_data.content.data.skills.map(skill => [
        skill.skill,
        Math.round(skill.score * 100)
      ])
    ),
    summary: doc.item_data.matching_score.data.justification.meta.description,
    stage: 'new', // Default stage for new matches
    otherMatches: [
      { jobTitle: "Similar Role", score: Math.round(doc.item_data.matching_score.data.score.value * 85) }
    ] as OtherMatch[] // Generate a sample match based on the main score
  }));
}; 