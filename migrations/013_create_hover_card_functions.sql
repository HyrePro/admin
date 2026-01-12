-- RPC functions for hover card data

-- Function to get job hover info
CREATE OR REPLACE FUNCTION get_job_hover_info(p_job_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    total_applications BIGINT,
    grade_levels TEXT[],
    subjects TEXT[],
    job_type TEXT,
    location TEXT,
    mode TEXT,
    salary_range TEXT
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.title,
        j.status,
        j.created_at,
        COALESCE(app_counts.total_applications, 0)::BIGINT AS total_applications,
        j.grade_levels,
        j.subjects,
        j.job_type,
        j.location,
        j.mode,
        j.salary_range
    FROM public.jobs j
    LEFT JOIN (
        SELECT 
            job_id, 
            COUNT(*) AS total_applications
        FROM public.job_applications 
        WHERE job_id = p_job_id
        GROUP BY job_id
    ) app_counts ON j.id = app_counts.job_id
    WHERE j.id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get candidate hover info
CREATE OR REPLACE FUNCTION get_candidate_hover_info(p_candidate_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    job_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    status TEXT,
    score INTEGER,
    avatar TEXT
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ja.id,
        ai.first_name,
        ai.last_name,
        ai.email,
        j.title AS job_title,
        ja.created_at,
        ja.status::TEXT AS status,
        ja.score,
        ai.avatar
    FROM public.job_applications ja
    JOIN public.applicant_info ai ON ja.applicant_id = ai.id
    JOIN public.jobs j ON ja.job_id = j.id
    WHERE ja.id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin user hover info
CREATE OR REPLACE FUNCTION get_admin_user_hover_info(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aui.id,
        aui.first_name,
        aui.last_name,
        aui.email,
        aui.role::TEXT AS role,
        aui.avatar,
        aui.created_at
    FROM public.admin_user_info aui
    WHERE aui.id = p_user_id;
END;
$$ LANGUAGE plpgsql;