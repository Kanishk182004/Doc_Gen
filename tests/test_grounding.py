import pytest
from app.schemas import DocumentIntake, DocumentContent, SectionContent, FindingSeverity
from app.tools.registry import ToolRegistry
from app.services.llm_client import LLMClient

def test_quality_review_detects_unsupported_exact_costs():
    """Test that review rejects invented exact dollar numbers when forbidden by request."""
    tools = ToolRegistry(LLMClient(api_key=""))
    intake = DocumentIntake(
        objective="Prepare a proposal for improving support",
        document_type="Business Proposal",
        target_audience="Executive Leadership",
        constraints=["Resource constraints: Small team with limited budget", "Do not invent exact costs"],
        assumptions=["Vendor selection is open"]
    )
    doc_content = DocumentContent(
        title="Customer Support Proposal",
        subtitle="Operational Improvement",
        document_type="Business Proposal",
        executive_summary="This executive summary covers our strategy to pilot automated AI tools.",
        sections=[
            SectionContent(
                heading="1. Problem Statement",
                level=1,
                body="Support team is small and overloaded.",
                bullet_points=["Inquiry volume high"]
            ),
            SectionContent(
                heading="2. Options Matrix",
                level=1,
                body="Comparison between options.",
                table_headers=["Option", "Cost"],
                table_rows=[["Pilot", "$250 per month"]]  # Unsupported exact cost!
            ),
            SectionContent(
                heading="3. Risk & Mitigation",
                level=1,
                body="Budget risk mitigation is critical.",
                bullet_points=["Set caps"]
            )
        ],
        assumptions=["Budget is limited"],
        next_steps=["Approve $500 initial payment"]  # Another unsupported exact cost!
    )

    review = tools.validate_document_quality(doc_content=doc_content, intake=intake)
    assert review.passed is False
    assert any(
        f.severity == FindingSeverity.ERROR and "unsupported exact dollar figures" in f.message
        for f in review.findings
    )

def test_quality_review_passes_qualitative_guardrails():
    """Test that review passes when qualitative guardrails and proposed metrics are used."""
    tools = ToolRegistry(LLMClient(api_key=""))
    intake = DocumentIntake(
        objective="Prepare a proposal for improving customer support without inventing exact costs",
        document_type="Business Proposal",
        target_audience="Executive Leadership",
        constraints=["Resource constraints: Small team with limited budget", "Do not invent exact costs"],
        assumptions=["No vendor pre-selected"]
    )
    doc_content = tools._generate_fallback_content(
        intake=intake,
        outline={"title": "Customer Support Proposal", "subtitle": "Pilot Evaluation"}
    )
    review = tools.validate_document_quality(doc_content=doc_content, intake=intake)
    assert review.passed is True
    # Ensure no exact dollar values exist in the content
    full_text = doc_content.title + " " + (doc_content.executive_summary or "")
    for s in doc_content.sections:
        full_text += " " + s.body
        if s.bullet_points:
            full_text += " " + " ".join(s.bullet_points)
        if s.table_rows:
            for r in s.table_rows:
                full_text += " " + " ".join(r)
    assert "$" not in full_text
