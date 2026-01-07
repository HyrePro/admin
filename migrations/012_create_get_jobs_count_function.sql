-- Function to get job count for a specific school with status and search filters
CREATE OR REPLACE FUNCTION get_jobs_count(p_school_id UUID, p_status TEXT DEFAULT 'ALL', p_search TEXT DEFAULT NULL)
RETURNS BIGINT
SECURITY DEFINER
AS $$
DECLARE
    result_count BIGINT;
BEGIN
    -- Validate input parameters
    IF p_school_id IS NULL THEN
        RAISE EXCEPTION 'School ID cannot be null';
    END IF;

    -- Query to count jobs based on school_id, status, and search parameters
    SELECT COUNT(*) INTO result_count
    FROM public.jobs j
    WHERE j.school_id = p_school_id
    -- Apply status filter if not 'ALL'
    AND (
        p_status = 'ALL' 
        OR j.status = UPPER(p_status)
    )
    -- Apply search filter if provided
    AND (
        p_search IS NULL 
        OR p_search = ''
        OR j.title ILIKE '%' || p_search || '%'
        OR j.description ILIKE '%' || p_search || '%'
        OR j.grade_levels::TEXT ILIKE '%' || p_search || '%'
    );

    RETURN result_count;
END;
$$ LANGUAGE plpgsql;