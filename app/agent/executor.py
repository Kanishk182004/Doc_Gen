import logging
from typing import Dict, Any, Tuple
from app.schemas import (
    DocumentIntake,
    ExecutionPlan,
    PlanTask,
    TaskStatus,
    DocumentContent,
    QualityReview,
    FindingSeverity,
)
from app.tools.registry import ToolRegistry

logger = logging.getLogger("autonomous_agent.executor")

class ExecutionOrchestrator:
    """Stage 3 & 5: Dependency-aware execution of tasks with reflection and bounded error recovery."""

    def __init__(self, tool_registry: ToolRegistry):
        self.tools = tool_registry

    def execute_plan(
        self, plan: ExecutionPlan, intake: DocumentIntake
    ) -> Tuple[ExecutionPlan, DocumentContent, QualityReview, str]:
        """
        Executes plan tasks in topological/dependency order.
        Tracks task lifecycle: pending -> in_progress -> completed | failed.
        """
        context: Dict[str, Any] = {
            "intake": intake,
            "outline": None,
            "doc_content": None,
            "quality_review": None,
            "docx_filename": None,
        }

        # Topological execution order
        task_map = {t.id: t for t in plan.tasks}
        completed_tasks = set()

        for task in plan.tasks:
            # Check dependency completion
            unmet_deps = [dep for dep in task.dependencies if dep not in completed_tasks]
            if unmet_deps:
                task.status = TaskStatus.FAILED
                task.error = f"Unmet dependencies: {unmet_deps}"
                logger.error(f"Task {task.id} aborted: unmet dependencies {unmet_deps}")
                raise RuntimeError(f"Cannot execute {task.id}: unmet dependencies {unmet_deps}")

            task.status = TaskStatus.IN_PROGRESS
            logger.info(f"Executing task {task.id}: {task.description}")

            try:
                if task.tool == "plan_document_structure":
                    outline = self.tools.execute_tool("plan_document_structure", intake=context["intake"])
                    context["outline"] = outline
                    task.result = f"Structured outline generated with {len(outline.get('required_sections', []))} sections."
                    task.status = TaskStatus.COMPLETED

                elif task.tool == "generate_document_content":
                    doc_content = self.tools.execute_tool(
                        "generate_document_content",
                        intake=context["intake"],
                        outline=context["outline"]
                    )
                    context["doc_content"] = doc_content
                    task.result = f"Generated document titled '{doc_content.title}' with {len(doc_content.sections)} sections."
                    task.status = TaskStatus.COMPLETED

                elif task.tool == "validate_document_quality":
                    review: QualityReview = self.tools.execute_tool(
                        "validate_document_quality",
                        doc_content=context["doc_content"]
                    )
                    
                    # Reflection & Bounded Self-Correction:
                    if not review.passed:
                        logger.warning("Quality check failed. Initiating bounded correction pass.")
                        # Apply bounded correction: Ensure fallback content replaces incomplete sections
                        repaired_content = self.tools._generate_fallback_content(
                            context["intake"], context["outline"]
                        )
                        context["doc_content"] = repaired_content
                        # Re-run review
                        review = self.tools.execute_tool(
                            "validate_document_quality",
                            doc_content=repaired_content
                        )
                    
                    context["quality_review"] = review
                    task.result = f"Quality review score: {review.score*100:.0f}%, passed: {review.passed} ({len(review.findings)} observations)."
                    task.status = TaskStatus.COMPLETED

                elif task.tool == "build_word_document":
                    docx_filename = self.tools.execute_tool(
                        "build_word_document",
                        doc_content=context["doc_content"]
                    )
                    context["docx_filename"] = docx_filename
                    task.result = f"Word document artifact saved as '{docx_filename}'."
                    task.status = TaskStatus.COMPLETED

                else:
                    raise ValueError(f"Unknown tool designated in plan: {task.tool}")

                completed_tasks.add(task.id)

            except Exception as e:
                task.status = TaskStatus.FAILED
                task.error = str(e)
                logger.error(f"Execution failed on task {task.id}: {e}", exc_info=True)
                raise RuntimeError(f"Task {task.id} execution failed: {e}")

        return plan, context["doc_content"], context["quality_review"], context["docx_filename"]

