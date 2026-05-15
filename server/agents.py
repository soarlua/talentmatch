import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from pydantic import BaseModel
from typing import List

# Carregar variáveis de ambiente (necessário para a chave do Groq)
load_dotenv()

# We set the LLM as a string for CrewAI 1.x (LiteLLM under the hood)
# This is more robust against Pydantic validation mismatches
MODEL = "groq/llama-3.1-8b-instant"

class CandidateMatchOutput(BaseModel):
    id: str
    name: str
    matchScore: int
    summary: str
    matchedSkills: List[str]
    missingRequirements: List[str]
    experienceYears: int
    linkedinUrl: str

class MatchingResponse(BaseModel):
    candidates: List[CandidateMatchOutput]
    jobTitle: str
    totalProcessed: int

def create_matching_crew(job_data: str, candidates_data: str):
    job_analyzer = Agent(
        role="Senior Job Requirements Analyst",
        goal=(
            "Read job descriptions and produce a normalized list of requirements "
            "(technical skills, experience, certifications, languages) each with its "
            "priority (mandatory, important, optional)."
        ),
        backstory=(
            "You are a technical recruiter with 15 years of experience in consulting. "
            "You have a special talent for decomposing messy job descriptions into "
            "clear, categorized requirements, distinguishing what is truly essential "
            "from what is merely desirable."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
    )
 
    cv_parser = Agent(
        role="CV Data Extraction Specialist",
        goal=(
            "For each candidate, extract a structured profile with skills, years of "
            "experience per area, past roles, certifications, and languages."
        ),
        backstory=(
            "You have read thousands of CVs. You see past buzzwords and identify real "
            "evidence of competence (years using the technology, type of projects, "
            "responsibilities). You never invent data that is not in the CV."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
    )
 
    matcher = Agent(
        role="Candidate-Job Compatibility Evaluator",
        goal=(
            "Compare each candidate against the job and compute a match score from 0 "
            "to 100, with a breakdown per criterion (skills, experience, extras). "
            "Explicitly list fulfilled requirements and missing requirements, giving "
            "more weight to mandatory requirements."
        ),
        backstory=(
            "You are a talent acquisition analyst focused on fairness and rigor. You "
            "heavily penalize the absence of mandatory requirements, give moderate "
            "weight to important ones, and light weight to optional ones. You always "
            "back the score with facts."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
    )
 
    explainer = Agent(
        role="Hiring Recommendation Communicator",
        goal=(
            "Produce a clear, concise explanation in English justifying each "
            "candidate's score, highlighting strengths (fulfilled requirements) and "
            "gaps (missing requirements). Sort the final ranking by score descending."
        ),
        backstory=(
            "You report to busy hiring managers. You write short, factual, actionable "
            "explanations — no jargon, no fluff, always grounded in the match data."
        ),
        llm=llm,
        allow_delegation=False,
        verbose=True,
    )

    # Tarefas
    task_analyze = Task(
        description=f"""
        Analisa a seguinte vaga:
        {job_data}

        E cruza com estes candidatos:
        {candidates_data}

        Identifica os pontos fortes e fracos de cada candidato em relação à vaga.
        """,
        expected_output="Uma avaliação técnica de cada candidato face aos requisitos.",
        agent=screener
    )

    analyze_job = Task(
        description=(
            "Analyze the following job and return a JSON with normalized requirements.\n\n"
            "JOB:\n{job_json}\n\n"
            "Rules:\n"
            "- Each requirement has: name, type (skill|experience|certification|language|other), "
            "priority (mandatory|important|optional), value.\n"
            "- If the job does not state a priority, infer it from context.\n"
            "- Do not invent requirements that are not in the description."
        ),
        expected_output=(
            'Strict JSON with the shape: {"job_id": "...", "title": "...", '
            '"requirements": [{"name": "...", "type": "...", "priority": "...", "value": "..."}]}'
        ),
        agent=agents["job_analyzer"],
    )
 
    parse_cvs = Task(
        description=(
            "For each CV in the list below, extract a structured profile.\n\n"
            "CVs:\n{cvs_json}\n\n"
            "Rules:\n"
            "- Each profile has: id, name, skills (list), experience_years (map area->years), "
            "roles (list), certifications (list), languages (list), summary (short).\n"
            "- Do not invent information. If something is not in the CV, omit it or use an empty list."
        ),
        expected_output=(
            'Strict JSON: {"profiles": [{"id": "...", "name": "...", "skills": [...], '
            '"experience_years": {...}, "roles": [...], "certifications": [...], '
            '"languages": [...], "summary": "..."}]}'
        ),
        agent=agents["cv_parser"],
    )
 
    match_candidates = Task(
        description=(
            "Compare each candidate profile (output of the previous task) against the "
            "job requirements (output of the first task). For each candidate, compute:\n"
            "- score: 0-100 (weighted average — mandatory weighs 60%, important 30%, optional 10%)\n"
            "- breakdown: {skills_score, experience_score, extras_score} (each 0-100)\n"
            "- fulfilled: list of names of fulfilled requirements\n"
            "- missing: list of names of missing requirements\n\n"
            "Heavily penalize the absence of mandatory requirements. Be factual: only "
            "mark a requirement as fulfilled if the profile has clear evidence."
        ),
        expected_output=(
            'Strict JSON: {"job_id": "...", "matches": [{"cv_id": "...", '
            '"candidate_name": "...", "score": 87.5, "breakdown": {"skills_score": ..., '
            '"experience_score": ..., "extras_score": ...}, "fulfilled": [...], "missing": [...]}]}'
        ),
        agent=agents["matcher"],
        context=[analyze_job, parse_cvs],
    )
 
    explain_ranking = Task(
        description=(
            "Take the matcher output and produce the final ranking ordered by score "
            "descending. For each candidate, add an 'explanation' field with 2-3 "
            "sentences in English justifying the score (strengths + gaps).\n\n"
            "Keep all original fields (cv_id, candidate_name, score, breakdown, "
            "fulfilled, missing) and add 'explanation'."
        ),
        expected_output=(
            'Strict JSON: {"job_id": "...", "job_title": "...", "results": '
            '[{"cv_id": "...", "candidate_name": "...", "score": ..., "breakdown": {...}, '
            '"fulfilled": [...], "missing": [...], "explanation": "..."}]} '
            "with results sorted by score desc."
        ),
        agent=agents["explainer"],
        context=[analyze_job, match_candidates],
    )

    task_rank = Task(
        description="""
        Com base na avaliação técnica, cria um ranking dos candidatos (do 1º lugar ao último).
        Gera uma lista estruturada de candidatos com pontuações de match (0-100), 
        resumo executivo, competências correspondentes e requisitos em falta.

        Certifica-te de incluir o linkedinUrl (usa https://linkedin.com/in/placeholder se não existir)
        e os anos de experiência para cada candidato.
        """,
        expected_output="Uma lista estruturada de rankings de candidatos em formato JSON.",
        output_json=MatchingResponse,
        agent=manager
    )

    return Crew(
        agents=[job_analyzer, cv_parser, matcher, explainer],
        tasks=[analyze_job, parse_cvs, match_candidates, explain_ranking],
        process=Process.sequential
    )