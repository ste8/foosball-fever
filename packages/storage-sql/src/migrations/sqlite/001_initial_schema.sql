CREATE TABLE players (
    id             TEXT PRIMARY KEY,
    first_name     TEXT NOT NULL,
    last_name      TEXT NOT NULL,
    display_name   TEXT NOT NULL,
    preferred_role TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
);

CREATE TABLE championships (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    archived_at TEXT,
    deleted_at  TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE roster_entries (
    id              TEXT PRIMARY KEY,
    championship_id TEXT NOT NULL REFERENCES championships(id),
    player_id       TEXT NOT NULL REFERENCES players(id),
    preferred_role  TEXT,
    created_at      TEXT NOT NULL,
    UNIQUE(championship_id, player_id)
);

CREATE TABLE match_days (
    id                TEXT PRIMARY KEY,
    championship_id   TEXT NOT NULL REFERENCES championships(id),
    match_day_number  INTEGER NOT NULL,
    played_at         TEXT NOT NULL,
    created_at        TEXT NOT NULL,
    UNIQUE(championship_id, match_day_number)
);

CREATE TABLE teams (
    id           TEXT PRIMARY KEY,
    match_day_id TEXT NOT NULL REFERENCES match_days(id),
    attacker_id  TEXT NOT NULL REFERENCES players(id),
    defender_id  TEXT NOT NULL REFERENCES players(id),
    team_number  INTEGER NOT NULL,
    UNIQUE(match_day_id, team_number),
    CHECK(attacker_id != defender_id)
);
