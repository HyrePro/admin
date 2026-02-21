import { Job } from "@/types/jobs-table";
import { ListFilters } from "@/lib/query/contracts/list-filters";

export type JobsListRequest = ListFilters;

export type JobsListResponse = {
  jobs: Job[];
  totalCount: number;
  message?: string;
};

