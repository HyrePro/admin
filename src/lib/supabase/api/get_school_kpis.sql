-- Function to get school-level KPIs
CREATE OR REPLACE FUNCTION get_school_kpis(school_id UUID, period TEXT DEFAULT 'all')
RETURNS TABLE (
    -- Campaign KPIs
    total_active_campaigns BIGINT,
    total_successful_campaigns BIGINT,
    total_failed_campaigns BIGINT,
    
    -- Candidate Pipeline KPIs
    candidates_assessment_stage BIGINT,
    candidates_interview_stage BIGINT,
    candidates_offered BIGINT,
    
    -- Hiring Metrics
    avg_time_to_hire NUMERIC,
    offer_extended_vs_accepted NUMERIC,
    offer_extended_vs_declined NUMERIC,
    
    -- Section-wise Performance
    section_wise_performance JSONB,
    
    -- Gender Ratio
    male_candidates BIGINT,
    female_candidates BIGINT,
    other_gender_candidates BIGINT
)
SECURITY DEFINER
AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set the start date based on the period filter
    CASE period
        WHEN 'day' THEN
            start_date := NOW() - INTERVAL '1 day';
        WHEN 'week' THEN
            start_date := NOW() - INTERVAL '1 week';
        WHEN 'month' THEN
            start_date := NOW() - INTERVAL '1 month';
        ELSE
            start_date := NULL; -- All time
    END CASE;

    -- Calculate KPIs
    RETURN QUERY
    WITH job_filter AS (
        SELECT id FROM public.jobs 
        WHERE jobs.school_id = get_school_kpis.school_id
        AND (start_date IS NULL OR jobs.created_at >= start_date)
    ),
    campaign_metrics AS (
        SELECT 
            COUNT(*) FILTER (WHERE jobs.status = 'OPEN') AS active_campaigns,
            COUNT(*) FILTER (WHERE jobs.status = 'CLOSED' AND EXISTS (
                SELECT 1 FROM public.offer_letters ol WHERE ol.job_id = jobs.id
            )) AS successful_campaigns,
            COUNT(*) FILTER (WHERE jobs.status = 'CLOSED' AND NOT EXISTS (
                SELECT 1 FROM public.offer_letters ol WHERE ol.job_id = jobs.id
            )) AS failed_campaigns
        FROM public.jobs
        WHERE jobs.school_id = get_school_kpis.school_id
        AND (start_date IS NULL OR jobs.created_at >= start_date)
    ),
    candidate_pipeline AS (
        SELECT 
            COUNT(DISTINCT ja.id) FILTER (WHERE ja.status IN ('assessment_evaluated', 'demo_evaluated')) AS assessment_stage,
            COUNT(DISTINCT ja.id) FILTER (WHERE ja.status IN ('interview_scheduled', 'interview_completed')) AS interview_stage,
            COUNT(DISTINCT ol.id) AS offered
        FROM job_filter j
        LEFT JOIN public.job_applications ja ON ja.job_id = j.id
        LEFT JOIN public.offer_letters ol ON ol.application_id = ja.id
    ),
    hiring_metrics AS (
        SELECT 
            COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (ol.created_at - jbs.created_at)) / 86400)::NUMERIC, 2), 0) AS avg_days_to_hire,
            COUNT(ol.id) AS offers_extended,
            COUNT(ar.id) AS offers_declined
        FROM job_filter j
        JOIN public.jobs jbs ON jbs.id = j.id
        JOIN public.offer_letters ol ON ol.job_id = j.id
        LEFT JOIN public.application_rejection ar ON ar.application_id = ol.application_id
        WHERE ol.created_at IS NOT NULL AND jbs.created_at IS NOT NULL
    ),
    section_performance AS (
        SELECT COALESCE(jsonb_build_object(
            'pedagogy', AVG(CASE WHEN dr.category = 'Pedagogy' THEN dr.is_correct::INTEGER ELSE NULL END),
            'communication', AVG(CASE WHEN dr.category = 'Communication' THEN dr.is_correct::INTEGER ELSE NULL END),
            'digital_literacy', AVG(CASE WHEN dr.category = 'Digital Literacy' THEN dr.is_correct::INTEGER ELSE NULL END),
            'subject_knowledge', AVG(CASE WHEN dr.category IN ('Mathematics', 'Science', 'English', 'Computer Science', 'Physics', 'Chemistry') THEN dr.is_correct::INTEGER ELSE NULL END)
        ), '{}') AS performance
        FROM job_filter j
        JOIN public.job_applications ja ON ja.job_id = j.id
        LEFT JOIN LATERAL jsonb_to_recordset(COALESCE(ja.detailed_results, '[]')) AS dr(category TEXT, is_correct BOOLEAN) ON TRUE
    ),
    gender_ratio AS (
        SELECT 
            COUNT(*) FILTER (WHERE ai.gender = 'Male') AS male,
            COUNT(*) FILTER (WHERE ai.gender = 'Female') AS female,
            COUNT(*) FILTER (WHERE ai.gender NOT IN ('Male', 'Female') OR ai.gender IS NULL) AS other
        FROM job_filter j
        JOIN public.job_applications ja ON ja.job_id = j.id
        LEFT JOIN public.applicant_info ai ON ai.id = ja.applicant_id
    )
    SELECT 
        COALESCE(cm.active_campaigns, 0),
        COALESCE(cm.successful_campaigns, 0),
        COALESCE(cm.failed_campaigns, 0),
        COALESCE(cp.assessment_stage, 0),
        COALESCE(cp.interview_stage, 0),
        COALESCE(cp.offered, 0),
        COALESCE(hm.avg_days_to_hire, 0),
        CASE 
            WHEN COALESCE(hm.offers_extended, 0) > 0 THEN 
                ROUND((COALESCE(hm.offers_extended, 0) - COALESCE(hm.offers_declined, 0))::NUMERIC / hm.offers_extended * 100, 2)
            ELSE 0 
        END,
        CASE 
            WHEN COALESCE(hm.offers_extended, 0) > 0 THEN 
                ROUND(COALESCE(hm.offers_declined, 0)::NUMERIC / hm.offers_extended * 100, 2)
            ELSE 0 
        END,
        sp.performance,
        COALESCE(gr.male, 0),
        COALESCE(gr.female, 0),
        COALESCE(gr.other, 0)
    FROM campaign_metrics cm
    CROSS JOIN candidate_pipeline cp
    CROSS JOIN hiring_metrics hm
    CROSS JOIN section_performance sp
    CROSS JOIN gender_ratio gr;
END;
$$ LANGUAGE plpgsql;