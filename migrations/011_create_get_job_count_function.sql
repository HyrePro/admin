-- Function to get job count for a specific school
CREATE OR REPLACE FUNCTION get_job_count_for_school(p_school_id UUID)
RETURNS TABLE (
    total_jobs BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(*)::BIGINT
    FROM public.jobs
    WHERE school_id = p_school_id;
END;
$$ LANGUAGE plpgsql;