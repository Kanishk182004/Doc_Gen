import uuid
import logging
from typing import Optional
from app.schemas import AgentRequest, AgentResponse, ExecutionPlan
from app.services.llm_client import LLMClient
from app.tools.registry import ToolRegistry
from app.agent.planner import DynamicPlanner
from app.agent.executor import ExecutionOrchestrator

logger = logging.getLogger("autonomous_agent.service")

class DocumentAgent:
    """End-to-end Autonomous Document Generation Agent."""

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or LLMClient()
        self.planner = DynamicPlanner(self.llm)
        self.tools = ToolRegistry(self.llm)
        self.orchestrator = ExecutionOrchestrator(self.tools)

    def run(self, agent_request: AgentRequest) -> AgentResponse:
        request_id = str(uuid.uuid4())
        logger.info(f"[{request_id}] Intake processing request: {agent_request.request[:80]}...")

        # Stage 1: Request intake & analysis
        intake = self.planner.parse_request(agent_request.request)
        logger.info(f"[{request_id}] Identified type: {intake.document_type}, assumptions: {len(intake.assumptions)}")

        # Stage 2: Dynamic planning
        plan = self.planner.generate_plan(intake)
        logger.info(f"[{request_id}] Generated plan with {len(plan.tasks)} tasks.")

        # Stage 3, 4, 5, 6: Execution Orchestration & DOCX generation
        executed_plan, doc_content, quality_review, docx_filename = self.orchestrator.execute_plan(
            plan, intake
        )

        llm_mode = "groq" if self.llm.is_available else "deterministic_fallback"

        # Serialize tasks for API response
        plan_trace = [
            {
                "id": t.id,
                "description": t.description,
                "status": t.status.value,
                "result": t.result,
                "error": t.error
            }
            for t in executed_plan.tasks
        ]

        return AgentResponse(
            status="completed",
            request_id=request_id,
            document_type=doc_content.document_type,
            title=doc_content.title,
            assumptions=doc_content.assumptions,
            plan=plan_trace,
            quality_review=quality_review,
            llm_mode=llm_mode,
            document_url=f"/documents/{docx_filename}",
            message=f"Document '{doc_content.title}' successfully generated and verified."
        )

