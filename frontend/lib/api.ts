import type {
  JobDescription,
  MatchingResponse,
  CandidateDetailResponse,
  HealthCheckResponse,
} from './types';

/**
 * API Configuration
 * 
 * Set NEXT_PUBLIC_API_BASE_URL in your .env.local file:
 * NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api
 * 
 * If not set, defaults to 'http://localhost:8000' for the local backend
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * API Error class for handling API-specific errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(
      errorBody.message || `Request failed with status ${response.status}`,
      response.status,
      errorBody.code
    );
  }

  return response.json();
}

/**
 * TalentMatch API Service
 * 
 * ENDPOINTS DOCUMENTATION:
 * 
 * 1. POST /match
 *    - Description: Submit a job description and get ranked candidate matches
 *    - Request Body: JobDescription (see types.ts)
 *    - Response: MatchingResponse { candidates: CandidateMatch[], jobTitle: string, totalProcessed: number }
 * 
 * 2. GET /candidates/:id
 *    - Description: Get detailed information about a specific candidate
 *    - URL Params: id (string) - The candidate's unique identifier
 *    - Response: CandidateDetailResponse { candidate: CandidateMatch, additionalInfo?: {...} }
 * 
 * 3. GET /health
 *    - Description: Check API health status
 *    - Response: HealthCheckResponse { status: 'ok' | 'error', version?: string, timestamp?: string }
 */
export const talentMatchApi = {
  /**
   * POST /match
   * Submit a job description to get matched candidates
   * 
   * Expected request body format (matches INPUT.json structure):
   * {
   *   "job_title": "Frontend Developer",
   *   "requirements": [
   *     { "skill": "React", "priority": "mandatory" },
   *     { "skill": "Angular", "priority": "optional" }
   *   ],
   *   "experience": {
   *     "years": 3,
   *     "priority": "mandatory"
   *   },
   *   "extras": [
   *     { "type": "certification", "value": "AWS", "priority": "optional" },
   *     { "type": "language", "value": "English B2", "priority": "mandatory" }
   *   ]
   * }
   * 
   * Expected response format:
   * {
   *   "candidates": [
   *     {
   *       "id": "uuid-string",
   *       "name": "Candidate Name",
   *       "matchScore": 95,
   *       "summary": "Executive summary...",
   *       "matchedSkills": ["React", "TypeScript"],
   *       "missingRequirements": ["AWS Certification"],
   *       "experienceYears": 5,
   *       "linkedinUrl": "https://linkedin.com/in/..."
   *     }
   *   ],
   *   "jobTitle": "Frontend Developer",
   *   "totalProcessed": 150
   * }
   */
  match: async (jobDescription: JobDescription): Promise<MatchingResponse> => {
    return fetchApi<MatchingResponse>('/match', {
      method: 'POST',
      body: JSON.stringify(jobDescription),
    });
  },

  /**
   * GET /candidates/:id
   * Get detailed information about a specific candidate
   * 
   * Expected response format:
   * {
   *   "candidate": { ...CandidateMatch },
   *   "additionalInfo": {
   *     "skills": ["React", "TypeScript", "Node.js"],
   *     "certifications": ["AWS Solutions Architect"],
   *     "education": ["BS Computer Science - MIT"]
   *   }
   * }
   */
  getCandidateDetails: async (candidateId: string): Promise<CandidateDetailResponse> => {
    return fetchApi<CandidateDetailResponse>(`/candidates/${candidateId}`);
  },

  /**
   * GET /health
   * Check if the API is available and healthy
   * 
   * Expected response format:
   * {
   *   "status": "ok",
   *   "version": "1.0.0",
   *   "timestamp": "2024-01-15T10:30:00Z"
   * }
   */
  healthCheck: async (): Promise<HealthCheckResponse> => {
    return fetchApi<HealthCheckResponse>('/health');
  },
};

/**
 * Helper to parse raw JSON string into JobDescription
 * Use this when the user pastes JSON into the textarea
 */
export function parseJobDescription(jsonString: string): JobDescription {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate required fields
    if (!parsed.job_title || typeof parsed.job_title !== 'string') {
      throw new Error('Missing or invalid job_title');
    }
    if (!Array.isArray(parsed.requirements)) {
      throw new Error('Missing or invalid requirements array');
    }
    if (!parsed.experience || typeof parsed.experience.years !== 'number') {
      throw new Error('Missing or invalid experience');
    }
    
    return parsed as JobDescription;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format. Please check your input.');
    }
    throw error;
  }
}
