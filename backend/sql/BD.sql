CREATE TABLE kanban_customization (
    id integer,
    colors_by_status TEXT,
    created_at timestamp not null,
    labels_by_status TEXT,
    updated_at timestamp,
    primary key (id)
);

CREATE TABLE ticket_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    old_status INTEGER,
    new_status INTEGER NOT NULL,
    changed_by TEXT,
    comment TEXT,
    solution TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
