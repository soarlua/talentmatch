import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_groq import ChatGroq

# Carregar variáveis de ambiente (necessário para a chave do Groq)
load_dotenv()

# Configuração do LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model_name="llama3-70b-8192",
    temperature=0.1
)

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
        Para cada um, fornece:
        1. O Nome e ID.
        2. A percentagem estimada de "Match".
        3. Uma justificação curta do porquê dessa posição.
        
        Gera a resposta em Markdown limpo.
        """,
        expected_output="Ranking final formatado em Markdown com percentagens de match.",
        agent=manager
    )

    return Crew(
        agents=[screener, manager],
        tasks=[task_analyze, task_rank],
        process=Process.sequential
    )