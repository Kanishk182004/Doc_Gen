import re
import logging
import base64
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, status, Header
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import (
    AgentRequest, 
    AgentResponse, 
    UserRegisterRequest, 
    UserLoginRequest, 
    GoogleAuthRequest
)
from app.agent.agent import DocumentAgent
from app.services import auth as auth_service

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("autonomous_agent.main")

# Initialize database
auth_service.init_db()

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

SAFE_FILENAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.%& ]+\.docx$")

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

# --- Authentication & User Endpoints ---

@app.post("/auth/register", tags=["Authentication"])
def register(payload: UserRegisterRequest):
    try:
        result = auth_service.register_user(
            email=payload.email,
            name=payload.name,
            password=payload.password
        )
        return result
    except Exception as e:
        if "UNIQUE constraint failed: users.email" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists."
            )
        logger.error(f"Error during registration: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not complete registration."
        )

@app.post("/auth/login", tags=["Authentication"])
def login(payload: UserLoginRequest):
    result = auth_service.login_user(
        email=payload.email,
        password=payload.password
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    return result

@app.post("/auth/google", tags=["Authentication"])
def google_auth(payload: GoogleAuthRequest):
    """Sign in or register using Google OAuth credentials."""
    email = payload.email
    name = payload.name or "Google User"
    avatar_url = payload.avatar_url

    # If raw Google ID token (credential) is passed, decode payload safely
    if payload.credential:
        try:
            parts = payload.credential.split(".")
            if len(parts) >= 2:
                # Add padding if required for base64 decoding
                payload_segment = parts[1]
                padded = payload_segment + "=" * ((4 - len(payload_segment) % 4) % 4)
                decoded_bytes = base64.urlsafe_b64decode(padded)
                token_data = json.loads(decoded_bytes.decode("utf-8"))
                email = token_data.get("email", email)
                name = token_data.get("name", name)
                avatar_url = token_data.get("picture", avatar_url)
        except Exception as e:
            logger.warning(f"Could not parse Google credential payload: {e}")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Google account email."
        )

    result = auth_service.get_or_create_google_user(
        email=email,
        name=name,
        avatar_url=avatar_url
    )
    return result

@app.get("/auth/me", tags=["Authentication"])
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization bearer token required."
        )
    token = authorization.split(" ")[1]
    user = auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please sign in again."
        )
    return {"user": user}


