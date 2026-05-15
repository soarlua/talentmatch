import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_groq import ChatGroq
from pydantic import BaseModel
from typing import List

# Carregar variáveis de ambiente (necessário para a chave do Groq)
load_dotenv()

# Configuração do LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama3-70b-8192",
    temperature=0.1
)

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
        tasks=[task_analyze, task_rank],
        process=Process.sequential
    )