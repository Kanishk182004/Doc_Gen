import re
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import AgentRequest, AgentResponse
from app.agent.agent import DocumentAgent

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("autonomous_agent.main")

app = FastAPI(
    title="Autonomous Document Agent API",
    description="Autonomous Agent that plans, executes, reviews, and delivers executive Word (.docx) documents.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize document agent singleton
document_agent = DocumentAgent()

SAFE_FILENAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.]+\.docx$")

@app.get("/", tags=["General"])
def root():
    return {
        "service": "Autonomous Document Agent",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "agent": "POST /agent",
            "health": "GET /health",
            "documents": "GET /documents/{filename}"
        }
    }

@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "healthy",
        "llm_provider": "groq",
        "llm_configured": document_agent.llm.is_available,
        "model": settings.GROQ_MODEL,
        "docs_directory": str(settings.GENERATED_DOCS_DIR)
    }

@app.post(
    "/agent",
    response_model=AgentResponse,
    status_code=status.HTTP_200_OK,
    tags=["Agent"]
)
def run_agent(payload: AgentRequest):
    req_text = payload.request.strip()
    if not req_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Request cannot be blank or whitespace."
        )

    try:
        response = document_agent.run(payload)
        return response
    except Exception as e:
        logger.error(f"Error executing agent request: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent workflow execution failed: {str(e)}"
        )

@app.get("/documents/{filename}", tags=["Documents"])
def download_document(filename: str):
    # Path traversal protection
    if not SAFE_FILENAME_REGEX.match(filename) or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename requested. Path traversal forbidden."
        )

    file_path = settings.GENERATED_DOCS_DIR / filename
    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested document was not found."
        )

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename
    )
