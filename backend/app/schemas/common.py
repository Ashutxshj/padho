from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str


class ErrorPayload(BaseModel):
    code: str
    message: str
    status: int
    timestamp: str
    details: Optional[List[ErrorDetail]] = None


class StandardErrorResponse(BaseModel):
    error: ErrorPayload


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: int
