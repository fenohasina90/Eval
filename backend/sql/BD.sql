CREATE TABLE kanban_customization (
    id integer,
    colors_by_status TEXT,
    created_at timestamp not null,
    labels_by_status TEXT,
    updated_at timestamp,
    primary key (id)
);