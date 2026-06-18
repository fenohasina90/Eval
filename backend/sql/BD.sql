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
    super_cout NUMERIC,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE super_cout (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    cout NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE cout_ouverture (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    cout_ouverture NUMERIC NOT NULL,
    pourcentage NUMERIC NOT NULL,
    super_cout_initial NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_super_cout_ticket_id ON super_cout(ticket_id);
CREATE INDEX idx_cout_ouverture_ticket_id ON cout_ouverture(ticket_id);
CREATE INDEX idx_ticket_status_history_ticket_id ON ticket_status_history(ticket_id);

