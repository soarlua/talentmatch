from pydantic import BaseModel
from typing import List

class JobDescription(BaseModel):
    title: str
    description: str
    requirements: List[str]