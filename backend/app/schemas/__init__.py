from app.schemas.common import ErrorDetail, ErrorPayload, StandardErrorResponse, PaginatedResponse
from app.schemas.user import UserBase, UserCreate, UserLogin, UserOut, Token, TokenPayload
from app.schemas.book import BookBase, BookOut, RoyaltySummary
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketOut, TicketDetailOut
from app.schemas.message import MessageCreate, MessageOut, InternalNoteCreate, InternalNoteOut
from app.schemas.ai import ClassificationResult, PriorityResult, DraftResponseRequest, DraftResponseResult

__all__ = [
    "ErrorDetail",
    "ErrorPayload",
    "StandardErrorResponse",
    "PaginatedResponse",
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserOut",
    "Token",
    "TokenPayload",
    "BookBase",
    "BookOut",
    "RoyaltySummary",
    "TicketCreate",
    "TicketUpdate",
    "TicketOut",
    "TicketDetailOut",
    "MessageCreate",
    "MessageOut",
    "InternalNoteCreate",
    "InternalNoteOut",
    "ClassificationResult",
    "PriorityResult",
    "DraftResponseRequest",
    "DraftResponseResult",
]
