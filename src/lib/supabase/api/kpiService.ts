import { createClient } from '@/lib/supabase/api/client';

export interface SchoolKPIs {
  total_active_campaigns: number;
  total_successful_campaigns: number;
  total_failed_campaigns: number;
  candidates_assessment_stage: number;
  candidates_interview_stage: number;
  candidates_offered: number;
  avg_time_to_hire: number;
  offer_extended_vs_accepted: number;
  offer_extended_vs_declined: number;
  section_wise_performance: {
    pedagogy: number | null;
    communication: number | null;
    digital_literacy: number | null;
    subject_knowledge: number | null;
  };
  male_candidates: number;
  female_candidates: number;
  other_gender_candidates: number;
}

export async function getSchoolKPIs(schoolId: string, period: string = 'all'): Promise<SchoolKPIs> {
  const supabase = createClient();
  
  // Call the PostgreSQL function
  const { data, error } = await supabase.rpc('get_school_kpis', {
    school_id: schoolId,
    period: period
  });

  if (error) {
    throw new Error(`Error fetching KPIs: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from KPI function');
  }

  // Transform the data to match our interface
  const kpis: SchoolKPIs = {
    total_active_campaigns: data?.total_active_campaigns ?? 0,
    total_successful_campaigns: data?.total_successful_campaigns ?? 0,
    total_failed_campaigns: data?.total_failed_campaigns ?? 0,
    candidates_assessment_stage: data?.candidates_assessment_stage ?? 0,
    candidates_interview_stage: data?.candidates_interview_stage ?? 0,
    candidates_offered: data?.candidates_offered ?? 0,
    avg_time_to_hire: data?.avg_time_to_hire ?? 0,
    offer_extended_vs_accepted: data?.offer_extended_vs_accepted ?? 0,
    offer_extended_vs_declined: data?.offer_extended_vs_declined ?? 0,
    section_wise_performance: {
      pedagogy: data?.section_wise_performance?.pedagogy ?? 0,
      communication: data?.section_wise_performance?.communication ?? 0,
      digital_literacy: data?.section_wise_performance?.digital_literacy ?? 0,
      subject_knowledge: data?.section_wise_performance?.subject_knowledge ?? 0,
    },
    male_candidates: data?.male_candidates ?? 0,
    female_candidates: data?.female_candidates ?? 0,
    other_gender_candidates: data?.other_gender_candidates ?? 0,
  };

  return kpis;
}