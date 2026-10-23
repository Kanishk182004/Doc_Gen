from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class FindingSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"

class AgentRequest(BaseModel):
    request: str = Field(..., min_length=5, max_length=4000, description="User instruction for document generation")
    provider: Optional[str] = Field(default="groq", description="LLM provider: groq, openai, anthropic, or gemini")
    api_key: Optional[str] = Field(default=None, description="Custom user-provided API key")
    model: Optional[str] = Field(default=None, description="Custom model identifier")

class DocumentIntake(BaseModel):
    objective: str
    document_type: str
    target_audience: str
    constraints: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)

class PlanTask(BaseModel):
    id: str
    description: str
    purpose: str
    tool: str
    dependencies: List[str] = Field(default_factory=list)
    expected_output: str
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[str] = None
    error: Optional[str] = None

class ExecutionPlan(BaseModel):
    tasks: List[PlanTask]

class SectionContent(BaseModel):
    heading: str
    level: int = 1  # 1 for Heading 1, 2 for Heading 2
    body: str
    bullet_points: Optional[List[str]] = None
    table_headers: Optional[List[str]] = None
    table_rows: Optional[List[List[str]]] = None

class DocumentContent(BaseModel):
    title: str
    subtitle: Optional[str] = None
    document_type: str
    executive_summary: Optional[str] = None
    sections: List[SectionContent]
    assumptions: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)

class QualityFinding(BaseModel):
    severity: FindingSeverity
    message: str
    corrective_action: Optional[str] = None

class QualityReview(BaseModel):
    passed: bool
    score: float = 1.0
    findings: List[QualityFinding] = Field(default_factory=list)

class AgentResponse(BaseModel):
    status: str
    request_id: str
    document_type: str
    title: str
    assumptions: List[str]
    plan: List[Dict[str, Any]]
    quality_review: QualityReview
    llm_mode: str  # "groq" or "deterministic_fallback"
    document_url: str
    message: str

