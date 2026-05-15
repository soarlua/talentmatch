import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process

load_dotenv()

# We set the LLM as a string for CrewAI 1.x (LiteLLM under the hood)
# This is more robust against Pydantic validation mismatches
MODEL = "groq/meta-llama/llama-4-scout-17b-16e-instruct"

# ==========================================
# CREW 1: MATCHING (3 Agentes)
# ==========================================
def create_scoring_crew():
    job_analyzer = Agent(
        role="Senior Job Requirements Analyst",
        goal="Read job descriptions and produce a normalized list of requirements each with its priority.",
        backstory="You are a technical recruiter with 15 years of experience. You extract clear requirements and distinguish essential from desirable.",
        llm=MODEL,
        allow_delegation=False,
        verbose=True,
    )
    
    profile_parser = Agent(
        role="Profile Data Extraction Specialist",
        goal="For each candidate, extract a structured profile with skills, years of experience, and roles.",
        backstory="You read profiles and identify real evidence of competence without inventing data.",
        llm=MODEL,
        allow_delegation=False,
        verbose=True,
    )
 
    matcher = Agent(
        role="Candidate-Job Compatibility Evaluator",
        goal="Compare candidate vs job and compute a match score (0-100). Output the final JSON list of candidates.",
        backstory="You heavily penalize the absence of mandatory requirements. You calculate scores meticulously based on the weights.",
        llm=MODEL,
        allow_delegation=False,
        verbose=True,
    )

    analyze_job = Task(
        description="Analyze the JOB and return JSON with normalized requirements.\nJOB:\n{job_json}\n\nIMPORTANT: Do NOT write code. Output only the raw JSON.",
        expected_output='Strict JSON: {"job_id": "...", "title": "...", "requirements": [{"name": "...", "type": "...", "priority": "...", "value": "..."}]}',
        agent=job_analyzer,
    )
 
    parse_profiles = Task(
        description="For each profile, extract a structured profile.\nprofiles:\n{cvs_json}\n\nIMPORTANT: Do NOT write javascript or python scripts. Do the extraction mentally and output only the raw JSON.",
        expected_output='Strict JSON: {"profiles": [{"id": "...", "name": "...", "skills": [...], "experience_years": 0}]}',
        agent=profile_parser,
    )
 
    match_candidates = Task(
        description=(
            "Compare profiles against job requirements. Compute score 0-100.\n"
            "Return the final array of candidates sorted by matchScore descending.\n"
            "IMPORTANT: DO NOT write code or scripts to do the math. You are the AI, do the evaluation yourself and output the final raw JSON structure ONLY."
        ),
        expected_output=(
            'Strict JSON: {"jobTitle": "...", "totalProcessed": 0, "candidates": '
            '[{"id": "...", "name": "...", "matchScore": 87, "matchedSkills": [...], "missingRequirements": [...], "experienceYears": 0, "linkedinUrl": "..."}]}'
        ),
        agent=matcher,
        context=[analyze_job, parse_profiles],
    )

    return Crew(
        agents=[job_analyzer, profile_parser, matcher],
        tasks=[analyze_job, parse_profiles, match_candidates],
        process=Process.sequential
    )

# ==========================================
# CREW 2: EXPLAINER (1 Agente)
# ==========================================
def create_explainer_crew():
    explainer = Agent(
        role="Hiring Recommendation Communicator",
        goal="Produce a clear, concise explanation justifying why a candidate is a good or bad fit.",
        backstory="You report to busy hiring managers. You write short, factual, actionable explanations based on candidate data.",
        llm=MODEL,
        allow_delegation=False,
        verbose=True,
    )

    explain_profile = Task(
        description="Write a 2-3 sentence executive summary for this candidate based on their profile data:\n{candidate_data}\n\nOutput only the summary text.",
        expected_output="A short text summary in English.",
        agent=explainer,
    )

    return Crew(
        agents=[explainer],
        tasks=[explain_profile],
        process=Process.sequential
    )