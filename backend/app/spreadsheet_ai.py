"""AI assistant for SheetCraft spreadsheet — local rules + optional OpenAI."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.config import settings
from app.spreadsheet_schemas import (
    AiAction,
    ChatMessage,
    SpreadsheetChatRequest,
    SpreadsheetChatResponse,
    WorkbookContext,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are SheetCraft AI, a spreadsheet copilot like Cursor but for Excel.
You help users analyze data, write formulas, and manipulate their workbook.

When the user asks you to change the spreadsheet, respond with JSON actions.
Always explain what you did in plain language.

Available action types:
- set_cell: {"type":"set_cell","address":"B2","value":"=SUM(B2:E2)"}
- set_cells: {"type":"set_cells","values":[{"address":"A1","value":"Header"},{"address":"B1","value":"100"}]}
- format_range: {"type":"format_range","range":"A1:F1","format":{"bold":true}}
- create_sheet: {"type":"create_sheet","name":"Summary"}
- select_range: {"type":"select_range","range":"A1:D10"}
- clear_range: {"type":"clear_range","range":"A5:B10"}

Formula tips: use =SUM(), =AVERAGE(), =IF(), cell refs like A1, ranges like A1:B5.
Return your response as JSON: {"reply": "...", "actions": [...]}
If no spreadsheet changes needed, return empty actions array.
"""

OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "spreadsheet_actions",
            "description": "Apply changes to the spreadsheet",
            "parameters": {
                "type": "object",
                "properties": {
                    "reply": {"type": "string", "description": "Explanation for the user"},
                    "actions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "type": {"type": "string"},
                                "address": {"type": "string"},
                                "range": {"type": "string"},
                                "value": {"type": "string"},
                                "values": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "address": {"type": "string"},
                                            "value": {"type": "string"},
                                        },
                                    },
                                },
                                "format": {"type": "object"},
                                "name": {"type": "string"},
                            },
                            "required": ["type"],
                        },
                    },
                },
                "required": ["reply", "actions"],
            },
        },
    }
]


def _parse_actions(raw: list[dict[str, Any]]) -> list[AiAction]:
    actions: list[AiAction] = []
    for item in raw:
        try:
            actions.append(AiAction.model_validate(item))
        except Exception:
            logger.warning("Skipping invalid action: %s", item)
    return actions


def _local_analyze(context: WorkbookContext, question: str) -> SpreadsheetChatResponse:
    """Rule-based local agent when no API key is configured."""
    q = question.lower().strip()
    csv = context.selection_csv or context.used_range_csv
    lines = [ln for ln in csv.strip().split("\n") if ln.strip()] if csv else []

    # Format commands
    if any(w in q for w in ("bold", "format header", "make bold")):
        rng = _extract_range(q) or "A1:F1"
        return SpreadsheetChatResponse(
            reply=f"Applied bold formatting to {rng}.",
            actions=[AiAction(type="format_range", range=rng, format={"bold": True})],
            mode="local",
        )

    if "currency" in q or "dollar" in q:
        rng = _extract_range(q) or context.selection.start_address
        return SpreadsheetChatResponse(
            reply=f"Formatted {rng} as currency.",
            actions=[AiAction(type="format_range", range=rng, format={"numberFormat": "currency"})],
            mode="local",
        )

    # SUM formula
    sum_match = re.search(r"sum\s+(?:of\s+)?([a-z]+\d+:[a-z]+\d+)", q, re.I)
    if sum_match or ("sum" in q and "formula" in q):
        rng = sum_match.group(1).upper() if sum_match else "B2:E2"
        target = _extract_address(q) or "F2"
        return SpreadsheetChatResponse(
            reply=f"Added =SUM({rng}) in {target}.",
            actions=[AiAction(type="set_cell", address=target, value=f"=SUM({rng})")],
            mode="local",
        )

    # Set cell value
    set_match = re.search(
        r"(?:set|put|write)\s+(.+?)\s+(?:in|to)\s+([a-z]+\d+)",
        q,
        re.I,
    )
    if set_match:
        val, addr = set_match.group(1).strip(), set_match.group(2).upper()
        if not val.startswith("=") and val.replace(".", "").replace("-", "").isdigit():
            val = val
        return SpreadsheetChatResponse(
            reply=f"Set {addr} to {val}.",
            actions=[AiAction(type="set_cell", address=addr, value=val)],
            mode="local",
        )

    # Create sheet
    sheet_match = re.search(r"(?:create|add|new)\s+(?:sheet|tab)\s+(?:named?\s+)?['\"]?(\w+)['\"]?", q, re.I)
    if sheet_match or ("new sheet" in q):
        name = sheet_match.group(1) if sheet_match else "Summary"
        return SpreadsheetChatResponse(
            reply=f"Created sheet '{name}'.",
            actions=[AiAction(type="create_sheet", name=name.capitalize())],
            mode="local",
        )

    # Clear range
    if "clear" in q or "delete" in q:
        rng = _extract_range(q) or f"{context.selection.start_address}:{context.selection.end_address}"
        return SpreadsheetChatResponse(
            reply=f"Cleared range {rng}.",
            actions=[AiAction(type="clear_range", range=rng)],
            mode="local",
        )

    # Analyze / summarize (after profit check)
    if any(w in q for w in ("analyze", "summarize", "summary", "insight", "tell me", "explain")) or (
        "what" in q and "profit" not in q
    ):
        summary = _summarize_csv(lines, context)
        return SpreadsheetChatResponse(reply=summary, actions=[], mode="local")

    # Profit / revenue questions from demo
    if "profit" in q:
        return SpreadsheetChatResponse(
            reply="Total profit is in cell F4 (=SUM(B4:E4)). Q1 profit is in B4 (=B2-B3). "
            "Select F4 to see the grand total, or ask me to 'format F4 bold'.",
            actions=[],
            mode="local",
        )

    if "help" in q or q in ("?", "what can you do"):
        return SpreadsheetChatResponse(
            reply=(
                "I'm SheetCraft AI — your spreadsheet copilot. Try:\n"
                "• **Summarize this data** — analyze selection\n"
                "• **Add sum formula for B2:E2 in F2**\n"
                "• **Format header row bold**\n"
                "• **Set 100 in C5**\n"
                "• **Create sheet Summary**\n"
                "• **What is the total profit?**\n\n"
                "With an OpenAI API key configured, I can handle complex requests too."
            ),
            actions=[],
            mode="local",
        )

    return SpreadsheetChatResponse(
        reply=(
            "I can help analyze data, write formulas, and format cells. "
            "Try: 'summarize selection', 'add sum formula for B2:E2 in F2', "
            "'format A1:F1 bold', or 'what is the total profit?'"
        ),
        actions=[],
        mode="local",
    )


def _extract_range(text: str) -> str | None:
    m = re.search(r"([a-z]+\d+:[a-z]+\d+)", text, re.I)
    return m.group(1).upper() if m else None


def _extract_address(text: str) -> str | None:
    m = re.search(r"\b([a-z]+\d+)\b", text, re.I)
    return m.group(1).upper() if m else None


def _summarize_csv(lines: list[str], context: WorkbookContext) -> str:
    if not lines:
        return f"No data in the current selection ({context.selection.start_address}). Try selecting a range with data first."

    nums: list[float] = []
    for line in lines:
        for cell in line.split(","):
            cell = cell.strip().strip('"')
            try:
                n = float(cell.replace("$", "").replace(",", "").replace("%", ""))
                nums.append(n)
            except ValueError:
                pass

    parts = [f"**Selection:** {context.selection.start_address}"]
    if context.selection.end_address != context.selection.start_address:
        parts[0] += f" to {context.selection.end_address}"
    parts.append(f"**Rows:** {len(lines)}")

    if nums:
        parts.append(f"**Numeric values found:** {len(nums)}")
        parts.append(f"**Sum:** {sum(nums):,.2f}")
        parts.append(f"**Average:** {sum(nums)/len(nums):,.2f}")
        parts.append(f"**Min:** {min(nums):,.2f} | **Max:** {max(nums):,.2f}")
    else:
        preview = lines[:5]
        parts.append("**Preview:**\n" + "\n".join(preview))

    return "\n".join(parts)


async def _openai_chat(req: SpreadsheetChatRequest) -> SpreadsheetChatResponse:
    context_block = f"""
Active sheet: {req.context.active_sheet}
Sheets: {', '.join(req.context.sheets)}
Selection: {req.context.selection.start_address}:{req.context.selection.end_address}

Selection data (CSV):
{req.context.selection_csv or '(empty)'}

Full sheet data (CSV):
{req.context.used_range_csv or '(empty)'}
"""
    messages: list[dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\nWorkbook context:\n" + context_block},
    ]
    for msg in req.messages[-10:]:
        messages.append({"role": msg.role, "content": msg.content})

    payload = {
        "model": settings.openai_model,
        "messages": messages,
        "tools": OPENAI_TOOLS,
        "tool_choice": {"type": "function", "function": {"name": "spreadsheet_actions"}},
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

    choice = data["choices"][0]["message"]
    tool_calls = choice.get("tool_calls") or []
    if tool_calls:
        args = json.loads(tool_calls[0]["function"]["arguments"])
        return SpreadsheetChatResponse(
            reply=args.get("reply", "Done."),
            actions=_parse_actions(args.get("actions", [])),
            mode="openai",
        )

    return SpreadsheetChatResponse(
        reply=choice.get("content", "I couldn't process that request."),
        actions=[],
        mode="openai",
    )


async def handle_spreadsheet_chat(req: SpreadsheetChatRequest) -> SpreadsheetChatResponse:
    last_user = next((m.content for m in reversed(req.messages) if m.role == "user"), "")

    if settings.openai_api_key:
        try:
            return await _openai_chat(req)
        except Exception as exc:
            logger.warning("OpenAI failed, falling back to local: %s", exc)

    return _local_analyze(req.context, last_user)
