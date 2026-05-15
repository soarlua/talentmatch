from pydantic import BaseModel
from typing import List, Optional

class JobRequirement(BaseModel):
    skill: str
    priority: str  # 'mandatory' or 'optional'

class ExperienceRequirement(BaseModel):
    years: int
    priority: str

class ExtraRequirement(BaseModel):
    type: str
    value: str
    priority: str

class JobDescription(BaseModel):
    job_title: str
    requirements: List[JobRequirement]
    experience: ExperienceRequirement
    extras: List[ExtraRequirement]