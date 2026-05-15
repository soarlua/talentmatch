export interface JobRequirement {
  skill: string;
  priority: 'mandatory' | 'optional';
}

export interface ExperienceRequirement {
  years: number;
  priority: 'mandatory' | 'optional';
}

export interface ExtraRequirement {
  type: 'certification' | 'language' | 'other';
  value: string;
  priority: 'mandatory' | 'optional';
}

export interface JobDescription {
  job_title: string;
  requirements: JobRequirement[];
  experience: ExperienceRequirement;
  extras: ExtraRequirement[];
}

export interface CandidateMatch {
  id: string;
  name: string;
  matchScore: number;
  summary: string;
  matchedSkills: string[];
  missingRequirements: string[];
  experienceYears: number;
  linkedinUrl: string;
}

// API Response types
export interface MatchingResponse {
  candidates: CandidateMatch[];
  jobTitle: string;
  totalProcessed: number;
}

export interface CandidateDetailResponse {
  candidate: CandidateMatch;
  additionalInfo?: {
    skills?: string[];
    certifications?: string[];
    education?: string[];
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  version?: string;
  timestamp?: string;
}

// Sample job description for input placeholder
export const sampleJobDescription: JobDescription = {
  job_title: "Frontend Developer",
  requirements: [
    { skill: "React", priority: "mandatory" },
    { skill: "Angular", priority: "optional" }
  ],
  experience: {
    years: 3,
    priority: "mandatory"
  },
  extras: [
    { type: "certification", value: "AWS", priority: "optional" },
    { type: "language", value: "English B2", priority: "mandatory" }
  ]
};
