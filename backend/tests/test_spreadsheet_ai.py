"""Tests for SheetCraft AI spreadsheet assistant."""

import pytest

from app.spreadsheet_ai import _local_analyze, _summarize_csv
from app.spreadsheet_schemas import SelectionContext, SpreadsheetChatRequest, WorkbookContext, ChatMessage


@pytest.fixture
def budget_context() -> WorkbookContext:
    return WorkbookContext(
        active_sheet="Budget",
        sheets=["Budget", "Formulas"],
        selection=SelectionContext(
            start_row=0,
            start_col=0,
            end_row=3,
            end_col=5,
            start_address="A1",
            end_address="F4",
        ),
        used_range_csv="Item,Q1,Q2\nRevenue,12000,14500",
        selection_csv="Item,Q1,Q2\nRevenue,12000,14500",
    )


def test_local_sum_formula(budget_context: WorkbookContext) -> None:
    req = SpreadsheetChatRequest(
        messages=[ChatMessage(role="user", content="add sum formula for B2:E2 in F2")],
        context=budget_context,
    )
    res = _local_analyze(budget_context, req.messages[-1].content)
    assert res.actions
    assert res.actions[0].type == "set_cell"
    assert res.actions[0].value == "=SUM(B2:E2)"


def test_local_bold_format(budget_context: WorkbookContext) -> None:
    res = _local_analyze(budget_context, "format A1:F1 bold")
    assert res.actions[0].type == "format_range"
    assert res.actions[0].format == {"bold": True}


def test_summarize_csv(budget_context: WorkbookContext) -> None:
    lines = budget_context.selection_csv.split("\n")
    summary = _summarize_csv(lines, budget_context)
    assert "Sum" in summary
    assert "12000" in summary or "26,500" in summary


def test_help_response(budget_context: WorkbookContext) -> None:
    res = _local_analyze(budget_context, "help")
    assert "SheetCraft AI" in res.reply
