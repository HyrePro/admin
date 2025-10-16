import { createClient } from "./client";

export interface ApplicationDistribution {
  applied: number;
  assessment: number;
  demo: number;
  interview: number;
  offered: number;
  hired: number;
}

export async function getApplicationDistribution(schoolId: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.rpc("get_application_distribution", {
      school_id: schoolId,
    });

    if (error) {
      throw new Error(error.message || "Failed to fetch application distribution data");
    }

    // Return the first item from the array, or a default object if empty
    if (data && data.length > 0) {
      return { data: data[0] as ApplicationDistribution, error: null };
    } else {
      return { 
        data: {
          applied: 0,
          assessment: 0,
          demo: 0,
          interview: 0,
          offered: 0,
          hired: 0
        }, 
        error: null 
      };
    }
  } catch (err) {
    console.error("Error fetching application distribution:", err);
    return {
      data: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}