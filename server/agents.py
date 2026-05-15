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
    # Agente 1: O Analista Técnico
    screener = Agent(
        role='Tech Recruiter',
        goal='Analisar a descrição da vaga e o perfil dos candidatos para encontrar as correspondências técnicas exatas.',
        backstory='És um recrutador técnico sénior. O teu olhar clínico deteta rapidamente se as skills de um candidato batem certo com o que a vaga exige.',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )

    # Agente 2: O Diretor de RH (Ranker)
    manager = Agent(
        role='Diretor de RH',
        goal='Avaliar a análise técnica e criar um ranking final justificado dos melhores candidatos.',
        backstory='És o decisor final. Gostas de relatórios diretos, claros e ordenados do melhor para o pior candidato, sempre com uma justificação.',
        llm=llm,
        verbose=True,
        allow_delegation=False
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
        agents=[screener, manager],
        tasks=[task_analyze, task_rank],
        process=Process.sequential
    )