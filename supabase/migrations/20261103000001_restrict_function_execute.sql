-- =============================================================================
-- Restrict who can call functions through the API (/rest/v1/rpc/...).
-- Supabase grants EXECUTE on new public functions to anon and authenticated by default.
-- Internal helpers (notifications, triggers, report scope checks) must not be callable directly;
-- e.g. notify_employee() would otherwise let anyone insert notifications for any employee.
-- =============================================================================

revoke execute on all functions in schema public from public, anon, authenticated;

-- Future functions created by the migration role start closed as well.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- RLS policy helpers: evaluated with the caller's privileges, so signed-in users need EXECUTE.
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.has_permission(text) to authenticated;
grant execute on function public.can_view_employee(uuid, text) to authenticated;

-- App-facing RPCs. Each checks the caller's employee link or permission internally.
grant execute on function public.check_in(numeric, numeric, numeric) to authenticated;
grant execute on function public.check_out(numeric, numeric, numeric) to authenticated;
grant execute on function public.correct_attendance(uuid, date, timestamptz, timestamptz, public.attendance_status, text) to authenticated;
grant execute on function public.decide_leave_request(uuid, boolean, text) to authenticated;
grant execute on function public.generate_appraisals(uuid) to authenticated;
grant execute on function public.review_appraisal(uuid, boolean, text) to authenticated;
grant execute on function public.decide_training_registration(uuid, boolean, text) to authenticated;
grant execute on function public.execute_mutation(uuid) to authenticated;
grant execute on function public.log_audit_event(text, text, text, text) to authenticated;
grant execute on function public.report_employee_statistics() to authenticated;
grant execute on function public.report_attendance_by_unit(date) to authenticated;
grant execute on function public.report_leave_by_unit(smallint) to authenticated;
grant execute on function public.report_appraisal_by_unit(uuid) to authenticated;
