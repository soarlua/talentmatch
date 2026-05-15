from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import ast
import json
import re
from typing import Any, Dict, List

# Local imports
from models import JobDescription
from mock_db import MOCK_CANDIDATES
from agents import create_scoring_crew, create_explainer_crew


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

JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.IGNORECASE | re.DOTALL)


def _stringify_job(job: JobDescription) -> str:
    return json.dumps(job.model_dump(), ensure_ascii=False, indent=2)


def _stringify_candidates() -> str:
    return json.dumps(list(MOCK_CANDIDATES.values()), ensure_ascii=False, indent=2)


def _extract_first_json_fragment(text: str) -> str:
    start = None
    stack: List[str] = []
    in_string = False
    escape = False

    for index, char in enumerate(text):
        if start is None:
            if char in "{[":
                start = index
                stack.append("}" if char == "{" else "]")
            continue

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
            continue

        if char in "{[":
            stack.append("}" if char == "{" else "]")
            continue

        if char in "}]":
            if not stack or char != stack[-1]:
                continue
            stack.pop()
            if not stack and start is not None:
                return text[start : index + 1]

    raise ValueError("No JSON object found in agent output.")


def _decode_json_text(text: str) -> Any:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Common LLM issue: trailing commas in objects/arrays.
    without_trailing_commas = re.sub(r",\s*([}\]])", r"\1", text)
    if without_trailing_commas != text:
        try:
            return json.loads(without_trailing_commas)
        except json.JSONDecodeError:
            pass

    # Common LLM issue: single-quoted Python-like dict/list output.
    try:
        literal = ast.literal_eval(text)
        if isinstance(literal, (dict, list)):
            return literal
    except (ValueError, SyntaxError):
        pass

    fragment = _extract_first_json_fragment(text)

    try:
        return json.loads(fragment)
    except json.JSONDecodeError:
        without_trailing_commas = re.sub(r",\s*([}\]])", r"\1", fragment)
        if without_trailing_commas != fragment:
            try:
                return json.loads(without_trailing_commas)
            except json.JSONDecodeError:
                pass
        literal = ast.literal_eval(fragment)
        if isinstance(literal, (dict, list)):
            return literal
        raise


def _load_json_payload(payload: Any) -> Any:
    if payload is None:
        raise ValueError("Empty agent output.")

    if isinstance(payload, (dict, list)):
        return payload

    for attribute in ("pydantic", "json_dict", "raw"):
        if hasattr(payload, attribute):
            value = getattr(payload, attribute)
            if value:
                return _load_json_payload(value)

    if isinstance(payload, str):
        text = payload.strip()
        if not text:
            raise ValueError("Empty agent output.")

        fence_match = JSON_FENCE_RE.search(text)
        if fence_match:
            text = fence_match.group(1).strip()

        return _decode_json_text(text)

    if hasattr(payload, "model_dump"):
        return payload.model_dump()

    raise ValueError(f"Unsupported agent output type: {type(payload)!r}")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "candidate"


def _candidate_lookup() -> Dict[str, Dict[str, Any]]:
    return {candidate_id: candidate for candidate_id, candidate in MOCK_CANDIDATES.items()}


def _linkedin_url(candidate_id: str, candidate_name: str) -> str:
    if candidate_id:
        return f"https://www.linkedin.com/in/{_slugify(candidate_name)}-{candidate_id}"
    return f"https://www.linkedin.com/in/{_slugify(candidate_name)}"


def _string_list(value: Any) -> List[str]:
    if isinstance(value, list):
        normalized: List[str] = []
        for item in value:
            if item is None:
                continue
            if isinstance(item, dict):
                name = item.get("name")
                if name:
                    normalized.append(str(name))
                continue
            normalized.append(str(item))
        return normalized
    return []


def _normalize_candidate(item: Dict[str, Any], lookup: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    candidate_id = str(
        item.get("id")
        or item.get("cv_id")
        or item.get("candidate_id")
        or ""
    )
    source = lookup.get(candidate_id, {})
    name = str(
        item.get("name")
        or item.get("candidate_name")
        or source.get("name")
        or "Unknown Candidate"
    )

    score = item.get("matchScore", item.get("score", 0))
    matched_skills = _string_list(item.get("matchedSkills") or item.get("fulfilled"))
    missing_requirements = _string_list(item.get("missingRequirements") or item.get("missing"))
    summary = str(
        item.get("summary")
        or item.get("explanation")
        or f"{name} is ranked with a score of {score}."
    )
    experience_years = item.get("experienceYears", item.get("experience_years"))
    if experience_years is None and isinstance(source.get("experience"), str):
        match = re.search(r"(\d+)", source["experience"])
        experience_years = int(match.group(1)) if match else 0
    if experience_years is None:
        experience_years = 0

    linkedin_url = str(
        item.get("linkedinUrl")
        or source.get("linkedinUrl")
        or _linkedin_url(candidate_id, name)
    )

    return {
        "id": candidate_id or source.get("id") or _slugify(name),
        "name": name,
        "matchScore": float(score),
        "summary": summary,
        "matchedSkills": matched_skills,
        "missingRequirements": missing_requirements,
        "experienceYears": int(experience_years),
        "linkedinUrl": linkedin_url,
    }


def _normalize_response(raw_output: Any, job: JobDescription) -> Dict[str, Any]:
    parsed = _load_json_payload(raw_output)
    lookup = _candidate_lookup()

    if isinstance(parsed, dict):
        candidates = parsed.get("candidates")
        if candidates is None:
            candidates = parsed.get("results")
        if candidates is None:
            candidates = parsed.get("matches")

        if isinstance(candidates, list):
            normalized_candidates = [
                _normalize_candidate(candidate, lookup)
                for candidate in candidates
                if isinstance(candidate, dict)
            ]
            normalized_candidates.sort(key=lambda candidate: candidate["matchScore"], reverse=True)
            total_processed = parsed.get("totalProcessed")
            if total_processed is None:
                total_processed = len(MOCK_CANDIDATES)
            return {
                "candidates": normalized_candidates,
                "jobTitle": parsed.get("jobTitle") or parsed.get("job_title") or job.job_title,
                "totalProcessed": total_processed,
            }

    raise ValueError("Agent output did not contain a candidate list.")

# ==========================================
# ENDPOINTS
# ==========================================

# 1. Health Check
@app.get("/health")
async def health_check():
    """Checks if the API is online."""
    return {"status": "ok", "message": "Server is running!"}

# 2. Get Candidate Info (Agora com AI on-demand)
@app.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: str):
    """Devolve os detalhes de um candidato e gera o summary com IA."""
    candidate = MOCK_CANDIDATES.get(str(candidate_id))

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    try:
        # Iniciar o agente explicador para gerar a descrição
        explainer_crew = create_explainer_crew()
        summary_result = explainer_crew.kickoff(inputs={
            "candidate_data": json.dumps(candidate, ensure_ascii=False)
        })

        # Devolver a estrutura com o novo summary
        return {
            "candidate": {
                "id": candidate["id"],
                "name": candidate["name"],
                "summary": str(summary_result).strip(),
                "experienceYears": int(re.search(r"(\d+)", candidate["experience"]).group(1)) if re.search(r"(\d+)", candidate["experience"]) else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. Match Candidates (Apenas 3 agentes)
@app.post("/match")
async def match_candidates(job: JobDescription):
    try:
        matching_crew = create_scoring_crew()
        result = matching_crew.kickoff(inputs={
            "job_json": _stringify_job(job),
            "cvs_json": _stringify_candidates(),
        })
        return _normalize_response(result, job)
    except (ValueError, json.JSONDecodeError, SyntaxError) as parse_error:
        print(f"CrewAI parsing error: {parse_error}")
        return {
            "candidates": [],
            "jobTitle": job.job_title,
            "totalProcessed": len(MOCK_CANDIDATES),
            "error": "AI returned malformed structured data. Please try again.",
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
