"""Pydantic schemas for SheetCraft AI endpoints."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class SelectionContext(BaseModel):
    start_row: int = 0
    start_col: int = 0
    end_row: int = 0
    end_col: int = 0
    start_address: str = "A1"
    end_address: str = "A1"


class WorkbookContext(BaseModel):
    active_sheet: str
    sheets: list[str]
    selection: SelectionContext
    used_range_csv: str = ""
    selection_csv: str = ""


class AiAction(BaseModel):
    type: Literal[
        "set_cell",
        "set_cells",
        "format_range",
        "create_sheet",
        "select_range",
        "clear_range",
    ]
    address: str | None = None
    range: str | None = None
    value: str | None = None
    values: list[dict[str, str]] | None = None  # [{address, value}]
    format: dict[str, Any] | None = None
    name: str | None = None


class SpreadsheetChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: WorkbookContext


class SpreadsheetChatResponse(BaseModel):
    reply: str
    actions: list[AiAction] = Field(default_factory=list)
    mode: Literal["local", "openai"] = "local"
