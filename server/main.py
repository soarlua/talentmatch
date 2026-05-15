from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json

# Local imports
from models import JobDescription
from mock_db import MOCK_CANDIDATES
from agents import create_matching_crew

# Initialize app
app = FastAPI(title="TalentMatch AI - Matcher API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# ENDPOINTS
# ==========================================

# 1. Health Check
@app.get("/health")
async def health_check():
    """Checks if the API is online."""
    return {"status": "ok", "message": "Server is running!"}

# 2. Get Candidate Info
@app.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: str):
    """Returns details for a specific candidate."""
    
    candidate = MOCK_CANDIDATES.get(str(candidate_id))

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    structured = structure_candidate(candidate)
    return structured


# 3. Match Candidates (CrewAI)
@app.post("/match")
async def match_candidates(job: JobDescription):
    """Submits a job and AI returns candidate ranking."""
    try:
        # Convert data to string for agents to read
        job_data_str = f"Title: {job.job_title}\n"
        job_data_str += "Requirements:\n"
        for r in job.requirements:
            job_data_str += f"- {r.skill} ({r.priority})\n"
        job_data_str += f"Experience Required: {job.experience.years} years ({job.experience.priority})\n"
        if job.extras:
            job_data_str += "Extras:\n"
            for e in job.extras:
                job_data_str += f"- {e.type}: {e.value} ({e.priority})\n"

        candidates_data_str = str(MOCK_CANDIDATES)

        # Call agents
        matching_crew = create_matching_crew(job_data_str, candidates_data_str)
        result = matching_crew.kickoff()

        # Extract structured output
        # CrewAI 1.x CrewOutput objects have pydantic, json_dict, and raw attributes
        
        final_data = None
        
        if hasattr(result, 'pydantic') and result.pydantic:
            final_data = result.pydantic.model_dump()
        elif hasattr(result, 'json_dict') and result.json_dict:
            final_data = result.json_dict
        else:
            # Fallback parsing if structured attributes are not available
            try:
                final_data = json.loads(result.raw)
            except Exception as parse_err:
                print(f"Failed to parse raw output as JSON: {parse_err}")
                print(f"Raw output: {result.raw}")
        
        if final_data:
            return final_data
            
        # If all extraction methods fail, return a structured error response
        return {
            "candidates": [],
            "jobTitle": job.job_title,
            "totalProcessed": len(MOCK_CANDIDATES),
            "error": "AI failed to produce a structured ranking. Please try again.",
            "raw_debug": str(result)[:500] # Include snippet for debugging
        }

    except Exception as e:
        print(f"CrewAI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


        
def structure_candidate(candidate: dict) -> dict:
    """
    Optional: structure or enrich candidate info
    (useful if you're planning to plug LangChain later 😉)
    """
    return {
        "id": candidate["id"],
        "profile": {
            "name": candidate["name"],
            "role": candidate["role"],
            "experience": candidate["experience"]
        },
        "skills": candidate["skills"],
        "summary": f"{candidate['name']} is a {candidate['role']} with skills in {', '.join(candidate['skills'])}."
    }
