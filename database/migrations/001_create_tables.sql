CREATE TABLE IF NOT EXISTS roles (
    id_role SERIAL PRIMARY KEY,
    role_name VARCHAR(45) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id_permission SERIAL PRIMARY KEY,
    permission_code VARCHAR(80) NOT NULL UNIQUE,
    permission_name VARCHAR(120) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id_role INT REFERENCES roles(id_role) ON DELETE CASCADE,
    id_permission INT REFERENCES permissions(id_permission) ON DELETE CASCADE,
    PRIMARY KEY (id_role, id_permission)
);

CREATE TABLE IF NOT EXISTS users (
    id_user SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id_role),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    username VARCHAR(60) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'Активний',
    department VARCHAR(120),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidate_status (
    id_status SERIAL PRIMARY KEY,
    status_name VARCHAR(45) NOT NULL UNIQUE,
    color_code VARCHAR(20),
    description TEXT
);

CREATE TABLE IF NOT EXISTS selection_stages (
    id_stage SERIAL PRIMARY KEY,
    stage_name VARCHAR(80) NOT NULL UNIQUE,
    stage_order INT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS candidates (
    id_candidate SERIAL PRIMARY KEY,
    public_id VARCHAR(20) NOT NULL UNIQUE,
    last_name VARCHAR(45) NOT NULL,
    first_name VARCHAR(45) NOT NULL,
    middle_name VARCHAR(45),
    birth_date DATE,
    gender VARCHAR(20),
    ipn VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(80),
    region VARCHAR(80),
    city VARCHAR(80),
    address VARCHAR(150),
    education_level VARCHAR(80),
    institution VARCHAR(120),
    speciality VARCHAR(120),
    work_experience TEXT,
    military_experience TEXT,
    desired_unit VARCHAR(120),
    current_status_id INT REFERENCES candidate_status(id_status),
    current_stage_id INT REFERENCES selection_stages(id_stage),
    recruiter_id INT REFERENCES users(id_user),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS document_types (
    id_document_type SERIAL PRIMARY KEY,
    type_name VARCHAR(80) NOT NULL UNIQUE,
    is_required BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS candidate_documents (
    id_document SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id_candidate) ON DELETE CASCADE,
    document_type_id INT REFERENCES document_types(id_document_type),
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255),
    file_path VARCHAR(255),
    mime_type VARCHAR(80),
    file_size BIGINT,
    status VARCHAR(40) DEFAULT 'Очікує перевірки',
    uploaded_by INT REFERENCES users(id_user),
    verified_by INT REFERENCES users(id_user),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    comment TEXT
);

CREATE TABLE IF NOT EXISTS candidate_stage_history (
    id_history SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id_candidate) ON DELETE CASCADE,
    stage_id INT REFERENCES selection_stages(id_stage),
    status_id INT REFERENCES candidate_status(id_status),
    changed_by INT REFERENCES users(id_user),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comment TEXT
);

CREATE TABLE IF NOT EXISTS recruitment_process (
    id_process SERIAL PRIMARY KEY,
    candidate_id INT NOT NULL REFERENCES candidates(id_candidate) ON DELETE CASCADE,
    stage_id INT REFERENCES selection_stages(id_stage),
    process_type VARCHAR(80) NOT NULL,
    result VARCHAR(80),
    score NUMERIC(5,2),
    notes TEXT,
    responsible_user_id INT REFERENCES users(id_user),
    process_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id_log SERIAL PRIMARY KEY,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(id_user),
    user_name VARCHAR(120),
    action VARCHAR(100) NOT NULL,
    object_type VARCHAR(60),
    object_id VARCHAR(40),
    old_value TEXT,
    new_value TEXT,
    result VARCHAR(30) DEFAULT 'SUCCESS',
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS system_settings (
    id_setting SERIAL PRIMARY KEY,
    setting_key VARCHAR(80) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT REFERENCES users(id_user)
);

CREATE TABLE IF NOT EXISTS reports (
    id_report SERIAL PRIMARY KEY,
    report_type VARCHAR(80) NOT NULL,
    period_from DATE,
    period_to DATE,
    generated_by INT REFERENCES users(id_user),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255)
);
