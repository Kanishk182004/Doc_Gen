import logging
import re
from typing import List
from app.schemas import DocumentIntake, ExecutionPlan, PlanTask, TaskStatus
from app.services.llm_client import LLMClient

logger = logging.getLogger("autonomous_agent.planner")

class DynamicPlanner:
    """Stage 1 & 2: Understand natural language, form assumptions, and synthesize a dynamic execution plan."""

    def __init__(self, llm_client: LLMClient):
        self.llm = llm_client

    def parse_request(self, user_request: str) -> DocumentIntake:
        """Stage 1: Request intake, determine document type, make sensible assumptions."""
        prompt = f"""
Analyze this user request for document generation.

User Request: "{user_request}"

Determine:
1. Primary objective.
2. Document type (e.g., "Project Plan", "Business Proposal", "Technical Design Document", "Meeting Minutes", "Standard Operating Procedure", "Business Report").
3. Target audience.
4. Specific constraints mentioned.
5. Explicit assumptions for any missing details. IMPORTANT: If the request says not to invent exact costs or if vendor/pricing is unconfirmed, do NOT state that assumptions about budget ranges will be made. Instead explicitly include: "No exact budget or vendor pricing has been assumed. Implementation timelines are planning estimates and must be validated against vendor capabilities, internal resources, and pilot requirements."

Return ONLY valid JSON matching this schema:
{{
  "objective": "Clear single-sentence objective",
  "document_type": "Document Type",
  "target_audience": "Intended readers",
  "constraints": ["Constraint 1", "Constraint 2"],
  "assumptions": ["Assumption 1", "Assumption 2"]
}}
"""
        response_text = self.llm.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        data = self.llm.extract_json(response_text) if response_text else None
        if data and "objective" in data and "document_type" in data:
            raw_obj = data["objective"]
            # Ensure objective is concise and not a long verbose sentence
            if len(raw_obj) > 60:
                raw_obj = raw_obj.split(".")[0]
                if len(raw_obj) > 60:
                    raw_obj = raw_obj[:57] + "..."
            data["objective"] = raw_obj

            # Sanitize assumptions against forbidden "budget ranges" phrasing
            clean_assumptions = []
            for a in data.get("assumptions", []):
                if "budget range" in a.lower():
                    clean_assumptions.append(
                        "No exact budget or vendor pricing has been assumed. Implementation timelines are planning "
                        "estimates and must be validated against vendor capabilities, internal resources, and pilot requirements."
                    )
                else:
                    clean_assumptions.append(a)
            data["assumptions"] = clean_assumptions
            return DocumentIntake(**data)

        # Robust heuristic fallback parser
        req_lower = user_request.lower()
        if "proposal" in req_lower:
            doc_type = "Business Proposal"
            audience = "Executive Leadership / Budget Approvers"
            assumptions = [
                "No exact budget or vendor pricing has been assumed. Implementation timelines are planning estimates and must be validated against vendor capabilities, internal resources, and pilot requirements.",
                "Budget is limited and requires a low-risk phased commitment.",
                "No specific AI vendor has been pre-selected; comparison is required.",
                "Success metrics and milestones are illustrative proposals pending pilot sign-off."
            ]
        elif "project plan" in req_lower or "plan" in req_lower:
            doc_type = "Project Plan"
            audience = "Project Team, Engineering & CX Stakeholders"
            assumptions = [
                "Implementation duration is bounded to the specified timeframe (e.g. 8 weeks).",
                "Existing support tools offer integration hooks or REST APIs.",
                "Dedicated role ownership will be staffed internally."
            ]
        elif "technical" in req_lower or "design" in req_lower:
            doc_type = "Technical Design Document"
            audience = "Engineering and Architecture Teams"
            assumptions = [
                "Standard cloud infrastructure and containerized services are utilized.",
                "Security and data privacy standards comply with industry baselines."
            ]
        elif "meeting" in req_lower or "minutes" in req_lower:
            doc_type = "Meeting Minutes"
            audience = "Meeting Participants & Department Leads"
            assumptions = [
                "Attendees and action items reflect the agenda items provided.",
                "Unspecified decisions are documented as open discussion points."
            ]
        else:
            doc_type = "Business Report"
            audience = "Organizational Stakeholders"
            assumptions = [
                "Standard corporate reporting structure is applicable.",
                "Key performance metrics are proposed for ongoing review."
            ]

        # Extract potential constraints
        constraints = []
        if "8 week" in req_lower or "eight week" in req_lower:
            constraints.append("8-week delivery timeframe")
        if "limited budget" in req_lower or "small team" in req_lower:
            constraints.append("Resource constraints: Small team with limited budget")
        if "no vendor" in req_lower or "not chosen a vendor" in req_lower or "without inventing exact costs" in req_lower or "do not invent exact costs" in req_lower:
            constraints.append("Pricing and vendor unconfirmed: Do not invent exact costs or vendor selections")

        # Form a concise, clean objective rather than a truncated prompt slice
        clean_objective = "General Business Initiative"
        if "customer support" in req_lower and "proposal" in req_lower:
            clean_objective = "Improving Customer Support with AI"
        elif "customer support" in req_lower and "project" in req_lower:
            clean_objective = "AI Customer Support Chatbot Implementation"
        elif "support" in req_lower:
            clean_objective = "Customer Support Optimization"
        else:
            first_sentence = user_request.strip().split(".")[0].strip()
            for prefix in ["create a ", "prepare a ", "draft a ", "build a ", "design a "]:
                if first_sentence.lower().startswith(prefix):
                    first_sentence = first_sentence[len(prefix):].strip()
            clean_objective = first_sentence[:60].strip()

        return DocumentIntake(
            objective=clean_objective,
            document_type=doc_type,
            target_audience=audience,
            constraints=constraints,
            assumptions=assumptions
        )

    def generate_plan(self, intake: DocumentIntake) -> ExecutionPlan:
        """Stage 2: Ask the LLM to generate a structured execution plan, or synthesize a dependency-valid plan."""
        prompt = f"""
You are an autonomous agent workflow planner. Create a structured 4-step execution plan to produce the requested document.

Intake:
- Objective: {intake.objective}
- Document Type: {intake.document_type}
- Target Audience: {intake.target_audience}

Available Tools:
1. "plan_document_structure"
2. "generate_document_content"
3. "validate_document_quality"
4. "build_word_document"

Plan Rules:
- Support 4 clearly ordered tasks: task_1 -> task_2 -> task_3 -> task_4.
- Each task must define: id, description, purpose, tool, dependencies, expected_output.
- Dependencies must strictly refer to prior valid task IDs.
- No circular dependencies.

Return ONLY valid JSON:
{{
  "tasks": [
    {{
      "id": "task_1",
      "description": "Design document outline and section specifications",
      "purpose": "Establish structured framework for {intake.document_type}",
      "tool": "plan_document_structure",
      "dependencies": [],
      "expected_output": "Structural outline dictionary"
    }},
    {{
      "id": "task_2",
      "description": "Synthesize context-specific sections, tables, and narrative",
      "purpose": "Draft comprehensive content aligned with {intake.target_audience}",
      "tool": "generate_document_content",
      "dependencies": ["task_1"],
      "expected_output": "Full DocumentContent object"
    }},
    {{
      "id": "task_3",
      "description": "Inspect document completeness, tables, and consistency",
      "purpose": "Conduct quality review and reflect on requirements",
      "tool": "validate_document_quality",
      "dependencies": ["task_2"],
      "expected_output": "QualityReview report with findings"
    }},
    {{
      "id": "task_4",
      "description": "Generate executive-styled Microsoft Word (.docx) document",
      "purpose": "Deliver styled artifact to dedicated output directory",
      "tool": "build_word_document",
      "dependencies": ["task_3"],
      "expected_output": "Unique .docx filename"
    }}
  ]
}}
"""
        response_text = self.llm.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        data = self.llm.extract_json(response_text) if response_text else None
        if data and "tasks" in data:
            try:
                plan = ExecutionPlan(**data)
                self.validate_plan_dependencies(plan)
                return plan
            except Exception as e:
                logger.warning(f"LLM plan validation failed ({e}), using deterministic dependency-validated plan.")

        # Deterministic Dependency-Aware Plan
        tasks = [
            PlanTask(
                id="task_1",
                description=f"Architect document hierarchy and section blueprints for {intake.document_type}",
                purpose=f"Define structured sections tailored for {intake.target_audience}",
                tool="plan_document_structure",
                dependencies=[],
                expected_output="Structural outline with section definitions"
            ),
            PlanTask(
                id="task_2",
                description=f"Draft comprehensive narrative, analytical tables, and assumptions for {intake.document_type}",
                purpose="Fulfill business requirements and operational constraints",
                tool="generate_document_content",
                dependencies=["task_1"],
                expected_output="Validated DocumentContent object"
            ),
            PlanTask(
                id="task_3",
                description="Conduct reflection check on document completeness, tables, and constraints",
                purpose="Evaluate output quality against requirements and ensure no hallucinated claims",
                tool="validate_document_quality",
                dependencies=["task_2"],
                expected_output="QualityReview assessment report"
            ),
            PlanTask(
                id="task_4",
                description="Compile styled Microsoft Word (.docx) binary artifact",
                purpose="Generate polished document with headings, tables, and footer metadata",
                tool="build_word_document",
                dependencies=["task_3"],
                expected_output="Downloadable .docx filename"
            )
        ]
        plan = ExecutionPlan(tasks=tasks)
        self.validate_plan_dependencies(plan)
        return plan

    @staticmethod
    def validate_plan_dependencies(plan: ExecutionPlan) -> None:
        """Verify that all dependency references exist and there are no circular dependencies."""
        task_ids = {t.id for t in plan.tasks}
        
        # 1. Check for unknown dependencies
        for t in plan.tasks:
            for dep in t.dependencies:
                if dep not in task_ids:
                    raise ValueError(f"Task '{t.id}' references undefined dependency '{dep}'.")
                if dep == t.id:
                    raise ValueError(f"Task '{t.id}' references itself as a dependency.")

        # 2. Cycle detection via Kahn's algorithm / topological sort check
        in_degree = {t.id: len(t.dependencies) for t in plan.tasks}
        graph = {t.id: [] for t in plan.tasks}
        for t in plan.tasks:
            for dep in t.dependencies:
                graph[dep].append(t.id)

        queue = [tid for tid, deg in in_degree.items() if deg == 0]
        visited_count = 0
        while queue:
            curr = queue.pop(0)
            visited_count += 1
            for neighbor in graph[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if visited_count != len(plan.tasks):
            raise ValueError("Circular dependency detected in execution plan.")

