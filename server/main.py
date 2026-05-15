from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Imports locais (dos teus outros ficheiros)
from models import JobDescription
from mock_db import MOCK_CANDIDATES
from agents import create_matching_crew

# Inicializar app
app = FastAPI(title="Hackathon MVP - HR Matcher API")

# Configurar CORS
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
    """Verifica se a API está online."""
    return {"status": "ok", "message": "Servidor a correr!"}

# 2. Obter Info do Candidato
@app.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: str):
    """Devolve os detalhes de um candidato específico."""
    candidate = MOCK_CANDIDATES.get(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato não encontrado.")
    return candidate

# 3. Fazer o Match (CrewAI)
@app.post("/match")
async def match_candidates(job: JobDescription):
    """Submete uma vaga e a AI devolve o ranking dos candidatos."""
    try:
        # Converter dados para string para os agentes lerem
        job_data_str = f"Título: {job.title}\nDescrição: {job.description}\nRequisitos: {', '.join(job.requirements)}"
        candidates_data_str = str(MOCK_CANDIDATES)

        # Chamar a função do ficheiro agents.py
        matching_crew = create_matching_crew(job_data_str, candidates_data_str)
        result = matching_crew.kickoff()

        return {
            "status": "sucesso",
            "job_analyzed": job.title,
            "ranking": str(result)
        }
    except Exception as e:
        print(f"Erro no CrewAI: {e}")
        raise HTTPException(status_code=500, detail=str(e))