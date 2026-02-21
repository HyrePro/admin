import {
  CandidateFunnelFilters,
  CandidateFunnelOverview,
  CandidateSuggestion,
  CandidateTimelineResponse,
} from "@/types/candidate-funnel-analytics";

export type CandidateFunnelOverviewRequest = CandidateFunnelFilters;
export type CandidateFunnelOverviewResponse = CandidateFunnelOverview;

export type CandidateSuggestionRequest = CandidateFunnelFilters & {
  candidateSearch: string;
};

export type CandidateSuggestionResponse = {
  candidates: CandidateSuggestion[];
};

export type CandidateTimelineRequest = CandidateFunnelFilters & {
  candidateKey: string;
  page: number;
  pageSize: number;
};

export type CandidateTimelineApiResponse = CandidateTimelineResponse;
