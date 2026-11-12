-- =============================================================================
-- Employee files (documents, SK, ijazah): max 5 MB, PDF/JPG/PNG only (decision 2026-11-12).
-- Enforced by Storage itself, so the limit holds even if the client check is bypassed.
-- =============================================================================

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
where id = 'employee-documents';
