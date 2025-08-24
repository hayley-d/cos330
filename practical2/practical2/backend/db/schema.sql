PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(36) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_description VARCHAR(255),
    permissions TEXT NOT NULL CHECK (json_valid(permissions)),
    CHECK (length(role_id) = 36
        AND substr(role_id, 9, 1)  = '-'
        AND substr(role_id, 14, 1) = '-'
        AND substr(role_id, 19, 1) = '-'
        AND substr(role_id, 24, 1) = '-'
        AND substr(role_id, 15, 1) = '4'
        AND lower(substr(role_id, 20, 1)) IN ('8','9','a','b')
    )
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(role_name);

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    last_login INTEGER DEFAULT NULL,
    is_approved INTEGER NOT NULL DEFAULT 0 CHECK (is_approved IN (0,1)),
    sign_in_count INTEGER NOT NULL DEFAULT 0 CHECK (sign_in_count >= 0),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
    current_sign_in_ip VARCHAR(50) DEFAULT NULL,
    last_sign_in_ip VARCHAR(50) DEFAULT NULL,
    role_id VARCHAR(36) NOT NULL REFERENCES roles(role_id) ON UPDATE CASCADE,
    mfa_totp_secret TEXT DEFAULT NULL,
    mfa_enrolled_at INTEGER DEFAULT NULL,
    CHECK (length(user_id) = 36
        AND substr(user_id, 9, 1)  = '-'
        AND substr(user_id, 14, 1) = '-'
        AND substr(user_id, 19, 1) = '-'
        AND substr(user_id, 24, 1) = '-'
        AND substr(user_id, 15, 1) = '4'
        AND lower(substr(user_id, 20, 1)) IN ('8','9','a','b')
    )
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

CREATE TABLE IF NOT EXISTS user_mfa_backup_codes (
    user_id   VARCHAR(36) NOT NULL,
    code_hash TEXT NOT NULL,
    used_at   INTEGER DEFAULT NULL,
    PRIMARY KEY (user_id, code_hash),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON user_mfa_backup_codes(user_id);

CREATE TABLE IF NOT EXISTS user_otp_challenges (
    user_id VARCHAR(36) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, purpose),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_otp_expires ON user_otp_challenges(expires_at);

CREATE TABLE IF NOT EXISTS request_log (
    request_id VARCHAR(36) NOT NULL PRIMARY KEY,
    endpoint VARCHAR(50) NOT NULL,
    origin_ip VARCHAR(50) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    success INTEGER NOT NULL DEFAULT 0 CHECK (success IN (0,1)),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_endpoint ON request_log(endpoint);

CREATE TABLE IF NOT EXISTS asset (
    asset_id VARCHAR(36) PRIMARY KEY,
    description TEXT,
    asset_type VARCHAR(50) NOT NULL,

    file_name VARCHAR(255),
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
    sha256 VARCHAR(64) NOT NULL, -- hex content hash for deupe/integrity

    content BLOB,

    payload_ciphertext BLOB, -- AES-GCM ciphertext
    payload_nonce BLOB, -- 12 bytes
    payload_tag BLOB, -- auth tag 16 bytes
    key_id VARCHAR(20) NOT NULL DEFAULT 'v1',

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER,
    deleted_at INTEGER,
    created_by VARCHAR(36) NOT NULL,
    deleted_by VARCHAR(36),
    updated_by VARCHAR(36),
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE CASCADE,
    CHECK (length(asset_id) = 36
        AND substr(asset_id, 9, 1)  = '-'
        AND substr(asset_id, 14, 1) = '-'
        AND substr(asset_id, 19, 1) = '-'
        AND substr(asset_id, 24, 1) = '-'
        AND substr(asset_id, 15, 1) = '4'
        AND lower(substr(asset_id, 20, 1)) IN ('8','9','a','b')
    ),
    CHECK (
        (asset_type = 'confidential'
         AND content IS NULL
         AND payload_ciphertext IS NOT NULL
         AND payload_nonce IS NOT NULL
         AND payload_tag IS NOT NULL)
            OR
        (asset_type <> 'confidential'
         AND content IS NOT NULL
         AND payload_ciphertext IS NULL
         AND payload_nonce IS NULL
         AND payload_tag IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_sha256 ON asset(sha256);
CREATE INDEX IF NOT EXISTS idx_asset_type ON asset(asset_type);

INSERT INTO roles (role_id, role_name, role_description, permissions) VALUES
('11111111-1111-4111-8111-111111111111', 'Admin', 'Full access to all resources',
 '{"image":["create_image","view_image","update_image","delete_image"],
   "document":["create_doc","view_doc","update_doc","delete_doc"],
   "confidential":["create_conf","view_conf","update_conf","delete_conf"]}'
),

('22222222-2222-4222-8222-222222222222', 'Manager', 'Manage most resources, full image/document access, limited confidential',
 '{"image":["create_image","view_image","update_image","delete_image"],
   "document":["create_doc","view_doc","update_doc","delete_doc"],
   "confidential":["create_conf","view_conf","update_conf"]}'
),

('33333333-3333-4333-8333-333333333333', 'Guest', 'View-only access to images',
 '{"image":["view_image"],
   "document":[],
   "confidential":[]}'
),

('44444444-4444-4444-8444-444444444444', 'User', 'Standard user with update rights for own resources',
 '{"image":["view_image","update_image"],
   "document":["view_doc","update_doc"],
   "confidential":["view_conf"]}'
);

INSERT INTO users (
    user_id,
    first_name,
    last_name,
    email,
    password_hash,
    created_at,
    is_approved,
    sign_in_count,
    failed_login_attempts,
    role_id
) VALUES (
          '55555555-5555-4555-8555-555555555555',
        'Super',
         'User',
             'hayleydod@proton.me',
     '$2a$12$U9LbQtAF5whd3PJVRdLP9ucSgOL.ZazQsu5za4i2IVNUyisGRuTAK',
         unixepoch(),
             1,
             0,
             0,
             '11111111-1111-4111-8111-111111111111'
);

INSERT INTO request_log (request_id, endpoint, origin_ip, user_id, created_at, success)
VALUES
    -- Login from South Africa at t0
    ('aaaa1111-1111-4111-8111-111111111111', '/login', '102.165.44.12',
     '55555555-5555-4555-8555-555555555555', unixepoch('now') - 120, 1),

    -- Then 30s later from Germany (impossible travel)
    ('aaaa1111-1111-4111-8111-111111111112', '/login', '91.23.55.101',
     '55555555-5555-4555-8555-555555555555', unixepoch('now') - 90, 1);

INSERT INTO request_log (request_id, endpoint, origin_ip, user_id, created_at, success)
VALUES

    ('bbbb1111-1111-4111-8111-111111111111', '/documents', '102.165.44.12',
     '55555555-5555-4555-8555-555555555555', unixepoch('now') - 60, 1),
    ('bbbb1111-1111-4111-8111-111111111112', '/images', '102.165.44.12',
     '55555555-5555-4555-8555-555555555555', unixepoch('now') - 30, 1);


-- Impossible travel: same user logs in from USA then Europe 2 minutes later
INSERT INTO request_log (request_id, endpoint, origin_ip, user_id, created_at, success)
VALUES
    ('11111111-1111-4111-8111-aaaaaaaaaaaa', '/login', '8.8.8.8', 'c9fc4dc1-98da-4bf0-aca3-175b04e0fa4e', strftime('%s','now','-10 minutes'), 1),
    ('22222222-2222-4222-8222-bbbbbbbbbbbb', '/login', '1.1.1.1', 'c9fc4dc1-98da-4bf0-aca3-175b04e0fa4e', strftime('%s','now','-8 minutes'), 1);

-- Session hijacking: same user switches IP in < 300s
INSERT INTO request_log (request_id, endpoint, origin_ip, user_id, created_at, success)
VALUES
    ('33333333-3333-4333-8333-cccccccccccc', '/login', '9.9.9.9', 'c9fc4dc1-98da-4bf0-aca3-175b04e0fa4e', strftime('%s','now','-5 minutes'), 1),
    ('44444444-4444-4444-8444-dddddddddddd', '/login', '4.4.4.4', 'c9fc4dc1-98da-4bf0-aca3-175b04e0fa4e', strftime('%s','now','-4 minutes'), 1);

