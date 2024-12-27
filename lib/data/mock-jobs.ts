import { type Job } from '@/types/job'

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'Oak Tech',
    location: 'San Francisco, CA',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/oak-tech.png',
    description: 'Join our team as a Senior Frontend Developer working with React, TypeScript, and Next.js to build scalable web applications.',
    salary: '$120k - $180k',
    postedAt: '2024-03-20T08:00:00Z',
    skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
    remote: true
  },
  {
    id: '2',
    title: 'UX/UI Designer',
    company: 'Oak Tech',
    location: 'San Francisco, CA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/oak-tech.png',
    description: 'Looking for a talented UX/UI Designer to create intuitive and beautiful user experiences for our enterprise products.',
    salary: '$90k - $140k',
    postedAt: '2024-03-19T15:30:00Z',
    skills: ['Figma', 'UI/UX', 'Design Systems', 'User Research'],
    remote: true
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    company: 'Tech Sim',
    location: 'Austin, TX',
    type: 'Full-time',
    rating: 4.9,
    logo: '/company-logos/tech-sim.png',
    description: 'Join our DevOps team to build and maintain our cloud infrastructure and CI/CD pipelines.',
    salary: '$130k - $180k',
    postedAt: '2024-03-18T10:15:00Z',
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
    remote: true
  },
  {
    id: '4',
    title: 'Digital Marketing Manager',
    company: 'Lion BI',
    location: 'New York, NY',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/lion-bi.png',
    description: 'Lead our digital marketing initiatives and develop comprehensive marketing strategies.',
    salary: '$85k - $120k',
    postedAt: '2024-03-17T14:45:00Z',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics'],
    remote: false
  },
  {
    id: '5',
    title: 'Backend Developer',
    company: 'Mat Tech',
    location: 'Seattle, WA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/mat-tech.png',
    description: 'Backend developer needed for building scalable APIs and microservices using Node.js and PostgreSQL.',
    salary: '$100k - $150k',
    postedAt: '2024-03-16T09:20:00Z',
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'GraphQL'],
    remote: false
  },
  {
    id: '6',
    title: 'Data Scientist',
    company: 'Lion BI',
    location: 'Boston, MA',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/lion-bi.png',
    description: 'Looking for a Data Scientist to help derive insights from our vast datasets and build predictive models.',
    salary: '$130k - $170k',
    postedAt: '2024-03-15T11:30:00Z',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
    remote: true
  },
  {
    id: '7',
    title: 'Retail Store Manager',
    company: 'Auchan',
    location: 'Chicago, IL',
    type: 'Full-time',
    rating: 4.3,
    logo: '/company-logos/auchan.png',
    description: 'Experienced retail manager needed to oversee store operations and lead a team of 20+ employees.',
    salary: '$60k - $80k',
    postedAt: '2024-03-14T13:15:00Z',
    skills: ['Retail Management', 'Team Leadership', 'Inventory Management', 'Customer Service'],
    remote: false
  },
  {
    id: '8',
    title: 'Supply Chain Analyst',
    company: 'Nestle',
    location: 'Arlington, VA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/nestle.png',
    description: 'Join our supply chain team to optimize logistics and improve operational efficiency.',
    salary: '$75k - $95k',
    postedAt: '2024-03-13T16:45:00Z',
    skills: ['Supply Chain Management', 'Data Analysis', 'SAP', 'Excel'],
    remote: false
  },
  {
    id: '9',
    title: 'Software Engineering Manager',
    company: 'CIT',
    location: 'San Jose, CA',
    type: 'Full-time',
    rating: 4.9,
    logo: '/company-logos/cit.png',
    description: 'Lead a team of software engineers in developing cutting-edge financial technology solutions.',
    salary: '$160k - $220k',
    postedAt: '2024-03-12T09:00:00Z',
    skills: ['Team Leadership', 'Software Architecture', 'Agile', 'Technical Leadership'],
    remote: true
  },
  {
    id: '10',
    title: 'Network Engineer',
    company: 'Nex-Tech',
    location: 'Denver, CO',
    type: 'Full-time',
    rating: 4.5,
    logo: '/company-logos/Nex-Tech.png',
    description: 'Design and maintain complex network infrastructure for enterprise clients.',
    salary: '$90k - $130k',
    postedAt: '2024-03-11T14:20:00Z',
    skills: ['Cisco', 'Network Security', 'CCNP', 'VPN'],
    remote: false
  },
  {
    id: '11',
    title: 'Business Intelligence Analyst',
    company: 'Lion BI',
    location: 'Miami, FL',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/lion-bi.png',
    description: 'Transform complex data into actionable insights using BI tools and statistical analysis.',
    salary: '$85k - $115k',
    postedAt: '2024-03-10T10:30:00Z',
    skills: ['Tableau', 'SQL', 'Power BI', 'Data Visualization'],
    remote: true
  },
  {
    id: '12',
    title: 'Energy Systems Engineer',
    company: 'Shell',
    location: 'Houston, TX',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/shell.png',
    description: 'Design and optimize energy systems for sustainable operations and reduced environmental impact.',
    salary: '$110k - $160k',
    postedAt: '2024-03-09T08:45:00Z',
    skills: ['Energy Systems', 'Mechanical Engineering', 'AutoCAD', 'Simulation'],
    remote: false
  },
  {
    id: '13',
    title: 'Project Manager',
    company: 'Total',
    location: 'Dallas, TX',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/total.png',
    description: 'Lead complex energy infrastructure projects from inception to completion.',
    salary: '$95k - $140k',
    postedAt: '2024-03-08T13:20:00Z',
    skills: ['Project Management', 'Budgeting', 'Risk Management', 'Stakeholder Management'],
    remote: false
  },
  {
    id: '14',
    title: 'Machine Learning Engineer',
    company: 'CIT',
    location: 'San Jose, CA',
    type: 'Full-time',
    rating: 4.9,
    logo: '/company-logos/cit.png',
    description: 'Develop and deploy machine learning models for financial risk assessment.',
    salary: '$140k - $190k',
    postedAt: '2024-03-07T11:15:00Z',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps'],
    remote: true
  },
  {
    id: '15',
    title: 'Store Operations Manager',
    company: 'Lowes',
    location: 'Phoenix, AZ',
    type: 'Full-time',
    rating: 4.4,
    logo: '/company-logos/lowes.png',
    description: 'Oversee daily store operations and lead a team of department managers.',
    salary: '$70k - $90k',
    postedAt: '2024-03-06T15:30:00Z',
    skills: ['Retail Operations', 'Team Management', 'Inventory Control', 'P&L Management'],
    remote: false
  },
  {
    id: '16',
    title: 'Cloud Solutions Architect',
    company: 'Tech Sim',
    location: 'Austin, TX',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/tech-sim.png',
    description: 'Design and implement cloud-native solutions for enterprise clients.',
    salary: '$140k - $200k',
    postedAt: '2024-03-05T09:45:00Z',
    skills: ['AWS', 'Azure', 'Cloud Architecture', 'Microservices'],
    remote: true
  },
  {
    id: '17',
    title: 'Research Scientist',
    company: 'Georgia Tech',
    location: 'Atlanta, GA',
    type: 'Full-time',
    rating: 4.9,
    logo: '/company-logos/georgia-tech-yellow-jackets.png',
    description: 'Conduct research in quantum computing and algorithm development.',
    salary: '$120k - $180k',
    postedAt: '2024-03-04T14:20:00Z',
    skills: ['Quantum Computing', 'Algorithm Design', 'Research Methods', 'Python'],
    remote: false
  },
  {
    id: '18',
    title: 'Business Development Manager',
    company: 'VZ Business',
    location: 'New York, NY',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/vz-biz.png',
    description: 'Drive business growth through strategic partnerships and sales initiatives.',
    salary: '$100k - $150k',
    postedAt: '2024-03-03T10:30:00Z',
    skills: ['Sales', 'Business Strategy', 'Negotiation', 'Account Management'],
    remote: true
  },
  {
    id: '19',
    title: 'Process Engineer',
    company: 'CNG',
    location: 'Pittsburgh, PA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/cng.png',
    description: 'Optimize manufacturing processes and implement quality control systems.',
    salary: '$85k - $120k',
    postedAt: '2024-03-02T16:15:00Z',
    skills: ['Process Optimization', 'Six Sigma', 'Quality Control', 'Lean Manufacturing'],
    remote: false
  },
  {
    id: '20',
    title: 'Full Stack Developer',
    company: 'Oak Tech',
    location: 'San Francisco, CA',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/oak-tech.png',
    description: 'Build and maintain full-stack applications using modern technologies.',
    salary: '$130k - $180k',
    postedAt: '2024-03-01T12:00:00Z',
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
    remote: true
  },
  {
    id: '21',
    title: 'Product Marketing Manager',
    company: 'Mat Tech',
    location: 'Seattle, WA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/mat-tech.png',
    description: 'Lead product marketing initiatives and go-to-market strategies.',
    salary: '$95k - $140k',
    postedAt: '2024-02-29T09:30:00Z',
    skills: ['Product Marketing', 'Market Research', 'Content Strategy', 'Analytics'],
    remote: true
  },
  {
    id: '22',
    title: 'Data Engineer',
    company: 'Lion BI',
    location: 'Boston, MA',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/lion-bi.png',
    description: 'Design and implement data pipelines and warehousing solutions.',
    salary: '$120k - $170k',
    postedAt: '2024-02-28T14:45:00Z',
    skills: ['Python', 'SQL', 'Apache Spark', 'ETL'],
    remote: true
  },
  {
    id: '23',
    title: 'UI Designer',
    company: 'International Academy of Design',
    location: 'Miami, FL',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/international-academy-of-design.png',
    description: 'Create beautiful and intuitive user interfaces for web and mobile applications.',
    salary: '$80k - $120k',
    postedAt: '2024-02-27T11:20:00Z',
    skills: ['UI Design', 'Figma', 'Adobe XD', 'Prototyping'],
    remote: true
  },
  {
    id: '24',
    title: 'Supply Chain Manager',
    company: 'Nestle',
    location: 'Chicago, IL',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/nestle.png',
    description: 'Oversee end-to-end supply chain operations and optimize logistics.',
    salary: '$100k - $150k',
    postedAt: '2024-02-26T16:30:00Z',
    skills: ['Supply Chain Management', 'Logistics', 'Inventory Management', 'Procurement'],
    remote: false
  },
  {
    id: '25',
    title: 'Security Engineer',
    company: 'Nex-Tech',
    location: 'Denver, CO',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/Nex-Tech.png',
    description: 'Implement and maintain cybersecurity measures across our infrastructure.',
    salary: '$120k - $170k',
    postedAt: '2024-02-25T10:15:00Z',
    skills: ['Cybersecurity', 'Network Security', 'Penetration Testing', 'Security Auditing'],
    remote: true
  },
  {
    id: '26',
    title: 'Quality Assurance Engineer',
    company: 'Mat Tech',
    location: 'Seattle, WA',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/mat-tech.png',
    description: 'Develop and execute test plans to ensure software quality and reliability.',
    salary: '$90k - $130k',
    postedAt: '2024-02-24T13:45:00Z',
    skills: ['Test Automation', 'Selenium', 'Jest', 'API Testing'],
    remote: true
  },
  {
    id: '27',
    title: 'Financial Analyst',
    company: 'CIT',
    location: 'New York, NY',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/cit.png',
    description: 'Analyze financial data and provide insights for business decision-making.',
    salary: '$85k - $120k',
    postedAt: '2024-02-23T11:30:00Z',
    skills: ['Financial Analysis', 'Excel', 'SQL', 'Financial Modeling'],
    remote: false
  },
  {
    id: '28',
    title: 'HR Manager',
    company: 'Total',
    location: 'Houston, TX',
    type: 'Full-time',
    rating: 4.5,
    logo: '/company-logos/total.png',
    description: 'Lead HR initiatives and manage employee relations for our energy division.',
    salary: '$90k - $130k',
    postedAt: '2024-02-22T15:20:00Z',
    skills: ['HR Management', 'Employee Relations', 'Recruitment', 'Performance Management'],
    remote: false
  },
  {
    id: '29',
    title: 'Mobile Developer',
    company: 'Tech Sim',
    location: 'Austin, TX',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/tech-sim.png',
    description: 'Develop mobile applications for iOS and Android platforms.',
    salary: '$110k - $160k',
    postedAt: '2024-02-21T09:15:00Z',
    skills: ['React Native', 'iOS', 'Android', 'Mobile Development'],
    remote: true
  },
  {
    id: '30',
    title: 'Procurement Specialist',
    company: 'Auchan',
    location: 'Miami, FL',
    type: 'Full-time',
    rating: 4.4,
    logo: '/company-logos/auchan.png',
    description: 'Manage vendor relationships and optimize procurement processes.',
    salary: '$65k - $90k',
    postedAt: '2024-02-20T14:30:00Z',
    skills: ['Procurement', 'Vendor Management', 'Contract Negotiation', 'Supply Chain'],
    remote: false
  },
  {
    id: '31',
    title: 'Systems Administrator',
    company: 'VZ Business',
    location: 'Chicago, IL',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/vz-biz.png',
    description: 'Maintain and optimize IT infrastructure and systems.',
    salary: '$80k - $120k',
    postedAt: '2024-02-19T10:45:00Z',
    skills: ['Linux', 'Windows Server', 'Network Administration', 'Cloud Infrastructure'],
    remote: true
  },
  {
    id: '32',
    title: 'Research Associate',
    company: 'Georgia Tech',
    location: 'Atlanta, GA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/georgia-tech-yellow-jackets.png',
    description: 'Conduct research in artificial intelligence and machine learning.',
    salary: '$70k - $100k',
    postedAt: '2024-02-18T15:30:00Z',
    skills: ['Machine Learning', 'Research', 'Python', 'Data Analysis'],
    remote: false
  },
  {
    id: '33',
    title: 'Sales Engineer',
    company: 'Shell',
    location: 'Dallas, TX',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/shell.png',
    description: 'Provide technical expertise in energy solutions sales process.',
    salary: '$100k - $150k',
    postedAt: '2024-02-17T11:20:00Z',
    skills: ['Technical Sales', 'Energy Systems', 'Solution Architecture', 'Customer Relations'],
    remote: false
  },
  {
    id: '34',
    title: 'Content Strategist',
    company: 'International Academy of Design',
    location: 'Los Angeles, CA',
    type: 'Full-time',
    rating: 4.5,
    logo: '/company-logos/international-academy-of-design.png',
    description: 'Develop and execute content strategy across digital platforms.',
    salary: '$70k - $100k',
    postedAt: '2024-02-16T14:15:00Z',
    skills: ['Content Strategy', 'SEO', 'Social Media', 'Analytics'],
    remote: true
  },
  {
    id: '35',
    title: 'Manufacturing Engineer',
    company: 'CNG',
    location: 'Detroit, MI',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/cng.png',
    description: 'Optimize manufacturing processes and implement automation solutions.',
    salary: '$85k - $120k',
    postedAt: '2024-02-15T09:30:00Z',
    skills: ['Manufacturing', 'Process Optimization', 'AutoCAD', 'Lean Manufacturing'],
    remote: false
  },
  {
    id: '36',
    title: 'Technical Product Manager',
    company: 'Oak Tech',
    location: 'San Francisco, CA',
    type: 'Full-time',
    rating: 4.9,
    logo: '/company-logos/oak-tech.png',
    description: 'Lead product development for our enterprise software solutions.',
    salary: '$130k - $180k',
    postedAt: '2024-02-14T13:45:00Z',
    skills: ['Product Management', 'Agile', 'Technical Leadership', 'Product Strategy'],
    remote: true
  },
  {
    id: '37',
    title: 'Data Analyst',
    company: 'Lion BI',
    location: 'Boston, MA',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/lion-bi.png',
    description: 'Analyze business data and create actionable insights.',
    salary: '$70k - $100k',
    postedAt: '2024-02-13T10:20:00Z',
    skills: ['SQL', 'Python', 'Data Visualization', 'Statistical Analysis'],
    remote: true
  },
  {
    id: '38',
    title: 'Store Manager',
    company: 'Lowes',
    location: 'San Diego, CA',
    type: 'Full-time',
    rating: 4.4,
    logo: '/company-logos/lowes.png',
    description: 'Manage store operations and lead a team of retail professionals.',
    salary: '$65k - $90k',
    postedAt: '2024-02-12T15:30:00Z',
    skills: ['Retail Management', 'Team Leadership', 'Operations', 'Customer Service'],
    remote: false
  },
  {
    id: '39',
    title: 'Solutions Architect',
    company: 'Nex-Tech',
    location: 'Seattle, WA',
    type: 'Full-time',
    rating: 4.8,
    logo: '/company-logos/Nex-Tech.png',
    description: 'Design and implement enterprise technology solutions.',
    salary: '$130k - $180k',
    postedAt: '2024-02-11T11:45:00Z',
    skills: ['Solution Architecture', 'Cloud Computing', 'Enterprise Architecture', 'Technical Leadership'],
    remote: true
  },
  {
    id: '40',
    title: 'Marketing Analyst',
    company: 'CIT',
    location: 'Chicago, IL',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/cit.png',
    description: 'Analyze marketing campaigns and provide data-driven recommendations.',
    salary: '$70k - $100k',
    postedAt: '2024-02-10T14:20:00Z',
    skills: ['Marketing Analytics', 'Data Analysis', 'Digital Marketing', 'SQL'],
    remote: true
  },
  {
    id: '41',
    title: 'Environmental Engineer',
    company: 'Total',
    location: 'Houston, TX',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/total.png',
    description: 'Develop and implement environmental protection strategies.',
    salary: '$90k - $130k',
    postedAt: '2024-02-09T09:15:00Z',
    skills: ['Environmental Engineering', 'Compliance', 'Risk Assessment', 'Project Management'],
    remote: false
  },
  {
    id: '42',
    title: 'Frontend Developer',
    company: 'Tech Sim',
    location: 'Austin, TX',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/tech-sim.png',
    description: 'Create responsive and interactive web applications.',
    salary: '$100k - $150k',
    postedAt: '2024-02-08T13:30:00Z',
    skills: ['React', 'JavaScript', 'CSS', 'Web Development'],
    remote: true
  },
  {
    id: '43',
    title: 'Operations Manager',
    company: 'Nestle',
    location: 'Denver, CO',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/nestle.png',
    description: 'Oversee daily operations and optimize business processes.',
    salary: '$85k - $120k',
    postedAt: '2024-02-07T10:45:00Z',
    skills: ['Operations Management', 'Process Improvement', 'Team Leadership', 'Budget Management'],
    remote: false
  },
  {
    id: '44',
    title: 'UX Researcher',
    company: 'International Academy of Design',
    location: 'San Francisco, CA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/international-academy-of-design.png',
    description: 'Conduct user research to inform product design decisions.',
    salary: '$90k - $130k',
    postedAt: '2024-02-06T15:20:00Z',
    skills: ['User Research', 'Usability Testing', 'Data Analysis', 'Research Methods'],
    remote: true
  },
  {
    id: '45',
    title: 'IT Support Specialist',
    company: 'VZ Business',
    location: 'Atlanta, GA',
    type: 'Full-time',
    rating: 4.4,
    logo: '/company-logos/vz-biz.png',
    description: 'Provide technical support and maintain IT systems.',
    salary: '$55k - $80k',
    postedAt: '2024-02-05T11:30:00Z',
    skills: ['Technical Support', 'Troubleshooting', 'Network Support', 'Customer Service'],
    remote: true
  },
  {
    id: '46',
    title: 'Business Analyst',
    company: 'Mat Tech',
    location: 'Boston, MA',
    type: 'Full-time',
    rating: 4.6,
    logo: '/company-logos/mat-tech.png',
    description: 'Analyze business processes and recommend improvements.',
    salary: '$75k - $110k',
    postedAt: '2024-02-04T14:15:00Z',
    skills: ['Business Analysis', 'Process Modeling', 'Requirements Gathering', 'Data Analysis'],
    remote: true
  },
  {
    id: '47',
    title: 'Mechanical Engineer',
    company: 'Shell',
    location: 'New Orleans, LA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/shell.png',
    description: 'Design and maintain mechanical systems for energy production.',
    salary: '$85k - $130k',
    postedAt: '2024-02-03T09:45:00Z',
    skills: ['Mechanical Engineering', 'AutoCAD', 'Project Management', 'System Design'],
    remote: false
  },
  {
    id: '48',
    title: 'Digital Designer',
    company: 'Oak Tech',
    location: 'Los Angeles, CA',
    type: 'Full-time',
    rating: 4.7,
    logo: '/company-logos/oak-tech.png',
    description: 'Create engaging digital designs for web and mobile platforms.',
    salary: '$80k - $120k',
    postedAt: '2024-02-02T13:20:00Z',
    skills: ['Digital Design', 'Adobe Creative Suite', 'UI Design', 'Typography'],
    remote: true
  },
  {
    id: '49',
    title: 'Supply Chain Coordinator',
    company: 'Auchan',
    location: 'Philadelphia, PA',
    type: 'Full-time',
    rating: 4.4,
    logo: '/company-logos/auchan.png',
    description: 'Coordinate supply chain operations and manage inventory.',
    salary: '$55k - $75k',
    postedAt: '2024-02-01T10:30:00Z',
    skills: ['Supply Chain', 'Inventory Management', 'Logistics', 'MS Office'],
    remote: false
  },
  {
    id: '50',
    title: 'AI Research Engineer',
    company: 'Georgia Tech',
    location: 'Atlanta, GA',
    type: 'Full-time',
    rating: 4.9,
    logo: '/company-logos/georgia-tech-yellow-jackets.png',
    description: 'Conduct research in artificial intelligence and develop novel algorithms.',
    salary: '$130k - $180k',
    postedAt: '2024-01-31T15:45:00Z',
    skills: ['Artificial Intelligence', 'Machine Learning', 'Python', 'Research'],
    remote: false
  }
]

// Helper function to get jobs by filter
export function getFilteredJobs(filters: {
  search?: string
  location?: string
  type?: string[]
  remote?: boolean
  salaryRange?: [number, number]
}) {
  let filtered = [...mockJobs]

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(job => 
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      job.description.toLowerCase().includes(searchLower)
    )
  }

  if (filters.location) {
    const locationLower = filters.location.toLowerCase()
    filtered = filtered.filter(job =>
      job.location.toLowerCase().includes(locationLower)
    )
  }

  if (filters.type?.length) {
    filtered = filtered.filter(job =>
      (filters.type || []).includes(job.type)
    )
  }

  if (filters.remote !== undefined) {
    filtered = filtered.filter(job =>
      job.remote === filters.remote
    )
  }

  if (filters.salaryRange) {
    const [min, max] = filters.salaryRange
    filtered = filtered.filter(job => {
      const salary = parseInt(job.salary.replace(/[^0-9]/g, ''))
      return salary >= min && salary <= max
    })
  }

  return filtered
} 