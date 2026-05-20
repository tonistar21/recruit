CREATE INDEX IF NOT EXISTS idx_candidates_public_id ON candidates(public_id);
CREATE INDEX IF NOT EXISTS idx_candidates_full_name ON candidates(last_name, first_name, middle_name);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(current_status_id);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON candidates(current_stage_id);
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter ON candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate ON candidate_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(log_time);
CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stage_history_candidate ON candidate_stage_history(candidate_id);
