import pytest
from app.schemas import ExecutionPlan, PlanTask, TaskStatus
from app.agent.planner import DynamicPlanner
from app.services.llm_client import LLMClient

class MockLLM(LLMClient):
    def __init__(self, response_map=None):
        super().__init__(api_key="mock", model="mock")
        self.response_map = response_map or {}

    @property
    def is_available(self):
        return True

    def chat_completion(self, messages, **kwargs):
        content = messages[0]["content"]
        for key, val in self.response_map.items():
            if key in content:
                return val
        return None

def test_planner_heuristics():
    planner = DynamicPlanner(LLMClient(api_key=""))
    intake = planner.parse_request("Create a project plan for launching an AI customer support chatbot")
    assert intake.document_type == "Project Plan"
    assert len(intake.assumptions) > 0

    plan = planner.generate_plan(intake)
    assert len(plan.tasks) == 4
    assert plan.tasks[0].id == "task_1"
    assert plan.tasks[1].dependencies == ["task_1"]

def test_planner_cycle_detection():
    # Circular dependency should raise ValueError
    tasks = [
        PlanTask(
            id="t1", description="desc", purpose="purp", tool="tool",
            dependencies=["t2"], expected_output="out"
        ),
        PlanTask(
            id="t2", description="desc", purpose="purp", tool="tool",
            dependencies=["t1"], expected_output="out"
        )
    ]
    with pytest.raises(ValueError, match="Circular dependency detected"):
        DynamicPlanner.validate_plan_dependencies(ExecutionPlan(tasks=tasks))

def test_planner_unknown_dependency():
    tasks = [
        PlanTask(
            id="t1", description="desc", purpose="purp", tool="tool",
            dependencies=["nonexistent_task"], expected_output="out"
        )
    ]
    with pytest.raises(ValueError, match="references undefined dependency"):
        DynamicPlanner.validate_plan_dependencies(ExecutionPlan(tasks=tasks))

