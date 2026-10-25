from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime, timezone

from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    description="Backend API for the BookLeaf Publishing Author Support & Communication Portal."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats Pydantic validation errors into uniform RFC 7807 JSON."""
    details = []
    for err in exc.errors():
        field = ".".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        details.append({
            "field": field,
            "issue": err.get("msg", "Invalid value")
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed. Please check field requirements.",
                "status": 422,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": details
            }
        }
    )


# Mount API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to BookLeaf Author Support & Communication Portal API",
        "docs": f"{settings.API_V1_STR}/docs"
    }
