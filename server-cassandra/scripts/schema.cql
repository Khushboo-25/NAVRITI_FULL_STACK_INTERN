-- Applied by: npm run setup-schema
-- Keyspace name comes from CASSANDRA_KEYSPACE (default: navriti)

CREATE TYPE IF NOT EXISTS attachment_udt (
    file_name text,
    file_url text,
    file_type text,
    file_size bigint,
    public_id text,
    resource_type text,
    original_name text
);

CREATE TYPE IF NOT EXISTS announcement_attachment_udt (
    url text,
    file_name text,
    file_type text,
    file_size bigint,
    public_id text,
    resource_type text
);

CREATE TABLE IF NOT EXISTS conversations (
    conversation_id uuid PRIMARY KEY,
    type text,
    display_name text,
    participant_key text,
    created_at timestamp,
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS conversations_by_participant_key (
    participant_key text PRIMARY KEY,
    conversation_id uuid
);

CREATE TABLE IF NOT EXISTS participants_by_conversation (
    conversation_id uuid,
    user_id text,
    joined_at timestamp,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS participants_by_user (
    user_id text,
    conversation_id uuid,
    joined_at timestamp,
    PRIMARY KEY (user_id, conversation_id)
);

CREATE TABLE IF NOT EXISTS messages_by_conversation (
    conversation_id uuid,
    created_at timestamp,
    message_id uuid,
    sender_id text,
    content text,
    message_type text,
    attachment frozen<attachment_udt>,
    status text,
    is_deleted boolean,
    updated_at timestamp,
    PRIMARY KEY (conversation_id, created_at, message_id)
) WITH CLUSTERING ORDER BY (created_at DESC, message_id DESC);

CREATE TABLE IF NOT EXISTS messages_by_id (
    message_id uuid PRIMARY KEY,
    conversation_id uuid,
    created_at timestamp,
    sender_id text,
    content text,
    message_type text,
    attachment frozen<attachment_udt>,
    status text,
    is_deleted boolean,
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS announcement_portals (
    portal_id uuid PRIMARY KEY,
    name text,
    description text,
    created_by text,
    target_audience text,
    created_at timestamp,
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS portal_members_by_portal (
    portal_id uuid,
    user_id text,
    member_id uuid,
    role text,
    added_by text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (portal_id, user_id)
);

CREATE TABLE IF NOT EXISTS portal_memberships_by_user (
    user_id text,
    portal_id uuid,
    member_id uuid,
    role text,
    added_by text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (user_id, portal_id)
);

CREATE TABLE IF NOT EXISTS announcements_by_portal (
    portal_id uuid,
    published_at timestamp,
    announcement_id uuid,
    sender_id text,
    title text,
    content text,
    attachments frozen<list<frozen<announcement_attachment_udt>>>,
    target_audience text,
    target_user_ids frozen<set<text>>,
    expires_at timestamp,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (portal_id, published_at, announcement_id)
) WITH CLUSTERING ORDER BY (published_at DESC, announcement_id DESC);

CREATE TABLE IF NOT EXISTS announcements_by_id (
    announcement_id uuid PRIMARY KEY,
    portal_id uuid,
    published_at timestamp,
    sender_id text,
    title text,
    content text,
    attachments frozen<list<frozen<announcement_attachment_udt>>>,
    target_audience text,
    target_user_ids frozen<set<text>>,
    expires_at timestamp,
    created_at timestamp,
    updated_at timestamp
);
