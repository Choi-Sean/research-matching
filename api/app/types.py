import json
from typing import Any

from sqlalchemy import TypeDecorator, UnicodeText


class JsonText(TypeDecorator):
    """JSON stored as NVARCHAR(MAX) / TEXT — behaves the same on SQLite, MSSQL and Postgres."""

    impl = UnicodeText
    cache_ok = True

    def process_bind_param(self, value: Any, dialect) -> str | None:
        return None if value is None else json.dumps(value, ensure_ascii=False)

    def process_result_value(self, value: str | None, dialect) -> Any:
        return None if value is None else json.loads(value)
