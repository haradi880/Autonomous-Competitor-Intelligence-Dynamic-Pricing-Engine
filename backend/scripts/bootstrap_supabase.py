from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

import psycopg

from config.settings import get_settings


def main() -> None:
    settings = get_settings()
    if not settings.supabase_db_url:
        raise SystemExit(
            "SUPABASE_DB_URL is required. Copy the Supabase Postgres connection string "
            "from Project Settings > Database and add it to backend/.env."
        )

    root = Path(__file__).resolve().parents[2]
    schema = root / "database" / "schema.sql"
    sql = schema.read_text(encoding="utf-8")

    with psycopg.connect(settings.supabase_db_url, autocommit=True) as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)

    print("supabase_bootstrap=ok")


if __name__ == "__main__":
    main()
