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

// Updated mock candidate matches with skill ratings
export const candidateMatches = [
  {
    name: "Sarah Miller",
    avatar: "/placeholder.svg",
    matchScore: 95,
    experience: "5 years",
    mainSkillScore: 98,
    skillRatings: {
      "React": 98,
      "TypeScript": 95,
      "Node.js": 92,
      "PostgreSQL": 88,
      "Python": 75,
      "AWS": 85
    },
    otherMatches: [
      { jobTitle: "Backend Developer", score: 89 },
      { jobTitle: "DevOps Engineer", score: 82 }
    ],
    summary: "Strong expertise in React with extensive full-stack experience. Demonstrates excellent problem-solving skills and modern development practices."
  },
  {
    name: "James Wilson",
    avatar: "/placeholder.svg",
    matchScore: 92,
    experience: "4 years",
    mainSkillScore: 90,
    skillRatings: {
      "Vue.js": 90,
      "JavaScript": 88,
      "Python": 85
    },
    otherMatches: [
      { jobTitle: "Frontend Developer", score: 87 },
      { jobTitle: "Data Scientist", score: 80 }
    ],
    summary: "Versatile developer with strong skills in JavaScript and Python. Proven ability to adapt to new technologies and solve complex problems."
  },
  {
    name: "Emily Chen",
    avatar: "/placeholder.svg",
    matchScore: 90,
    experience: "6 years",
    mainSkillScore: 95,
    skillRatings: {
      "Angular": 95,
      "Java": 92,
      "Spring": 90
    },
    otherMatches: [
      { jobTitle: "Full Stack Developer", score: 92 },
      { jobTitle: "Backend Developer", score: 88 }
    ],
    summary: "Experienced Java developer with a strong focus on Spring and Angular. Demonstrates excellent problem-solving skills and modern development practices."
  },
  {
    name: "Michael Brown",
    avatar: "/placeholder.svg",
    matchScore: 88,
    experience: "3 years",
    mainSkillScore: 90,
    skillRatings: {
      "React Native": 90,
      "Firebase": 88,
      "AWS": 85
    },
    otherMatches: [
      { jobTitle: "Mobile Developer", score: 87 },
      { jobTitle: "Cloud Engineer", score: 80 }
    ],
    summary: "Skilled React Native developer with experience in Firebase and AWS. Proven ability to develop high-quality mobile applications and cloud infrastructure."
  },
  {
    name: "Lisa Anderson",
    avatar: "/placeholder.svg",
    matchScore: 87,
    experience: "4 years",
    mainSkillScore: 90,
    skillRatings: {
      "UI/UX": 90,
      "Figma": 95,
      "Adobe XD": 92
    },
    otherMatches: [
      { jobTitle: "UX Designer", score: 85 },
      { jobTitle: "Graphic Designer", score: 80 }
    ],
    summary: "Experienced UI/UX designer with a strong focus on Figma and Adobe XD. Proven ability to create visually appealing and user-friendly designs."
  },
  {
    name: "David Kim",
    avatar: "/placeholder.svg",
    matchScore: 85,
    experience: "5 years",
    mainSkillScore: 90,
    skillRatings: {
      "Python": 90,
      "Django": 88,
      "PostgreSQL": 85
    },
    otherMatches: [
      { jobTitle: "Backend Developer", score: 87 },
      { jobTitle: "Data Scientist", score: 80 }
    ],
    summary: "Skilled Python developer with experience in Django and PostgreSQL. Proven ability to develop high-quality backend systems and data analysis."
  },
  {
    name: "Anna Martinez",
    avatar: "/placeholder.svg",
    matchScore: 84,
    experience: "4 years",
    mainSkillScore: 90,
    skillRatings: {
      "JavaScript": 90,
      "React": 95,
      "MongoDB": 88
    },
    otherMatches: [
      { jobTitle: "Full Stack Developer", score: 87 },
      { jobTitle: "Backend Developer", score: 85 }
    ],
    summary: "Experienced JavaScript developer with a strong focus on React and MongoDB. Demonstrates excellent problem-solving skills and modern development practices."
  },
  {
    name: "Tom Johnson",
    avatar: "/placeholder.svg",
    matchScore: 82,
    experience: "3 years",
    mainSkillScore: 85,
    skillRatings: {
      "PHP": 85,
      "Laravel": 88,
      "MySQL": 80
    },
    otherMatches: [
      { jobTitle: "Backend Developer", score: 80 },
      { jobTitle: "Database Administrator", score: 75 }
    ],
    summary: "Skilled PHP developer with experience in Laravel and MySQL. Proven ability to develop high-quality backend systems and database administration."
  },
  {
    name: "Rachel Lee",
    avatar: "/placeholder.svg",
    matchScore: 81,
    experience: "5 years",
    mainSkillScore: 90,
    skillRatings: {
      "Ruby": 90,
      "Rails": 88,
      "PostgreSQL": 85
    },
    otherMatches: [
      { jobTitle: "Backend Developer", score: 87 },
      { jobTitle: "Data Scientist", score: 80 }
    ],
    summary: "Skilled Ruby developer with experience in Rails and PostgreSQL. Proven ability to develop high-quality backend systems and data analysis."
  },
  {
    name: "Chris Taylor",
    avatar: "/placeholder.svg",
    matchScore: 80,
    experience: "4 years",
    mainSkillScore: 85,
    skillRatings: {
      "Flutter": 85,
      "Dart": 88,
      "Firebase": 80
    },
    otherMatches: [
      { jobTitle: "Mobile Developer", score: 87 },
      { jobTitle: "Cloud Engineer", score: 80 }
    ],
    summary: "Skilled Flutter developer with experience in Dart and Firebase. Proven ability to develop high-quality mobile applications and cloud infrastructure."
  }
]

// Helper function for skill color
export const getSkillColor = (score: number): string => {
  if (score >= 90) return "bg-green-500"
  if (score >= 80) return "bg-blue-500"
  if (score >= 70) return "bg-yellow-500"
  return "bg-red-500"
} 