"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  getMCQDetailsByJobId,
  type MCQDetail,
  type MCQQuestionReport,
} from "@/lib/supabase/api/get-mcq-details";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type JobMcqQuestionsDialogProps = {
  jobId: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type JobMCQRecord = MCQDetail & Record<string, unknown>;

export function JobMcqQuestionsDialog({
  jobId,
  open,
  onOpenChange,
}: JobMcqQuestionsDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["job-mcq-question-bank", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("Job ID is required");
      const result = await getMCQDetailsByJobId(jobId);
      if (result.error) throw new Error(result.error);
      return (result.data ?? []) as JobMCQRecord[];
    },
    enabled: open && Boolean(jobId),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (prev) => prev,
  });

  const questions = data ?? [];

  React.useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
  }, [open, jobId]);

  React.useEffect(() => {
    if (selectedIndex > 0 && selectedIndex >= questions.length) {
      setSelectedIndex(Math.max(0, questions.length - 1));
    }
  }, [questions.length, selectedIndex]);

  const selectedQuestion = questions[selectedIndex];
  const parsedOptions = useMemo(
    () => normalizeOptions(selectedQuestion?.options),
    [selectedQuestion?.options],
  );
  const correctAnswerInfo = useMemo(
    () => getCorrectAnswerInfo(selectedQuestion, parsedOptions),
    [parsedOptions, selectedQuestion],
  );
  const extraEntries = useMemo(() => extractExtraEntries(selectedQuestion), [selectedQuestion]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="full"
        className="w-[99vw] h-[90vh] p-0 overflow-hidden"
      >
        <DialogHeader className="px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            MCQ Question Bank
            {questions.length > 0 ? <Badge variant="secondary">{questions.length} Questions</Badge> : null}
          </DialogTitle>
          <DialogDescription>
            Review question text, correct answers, and available reports without scrolling through the full list.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(90vh-86px)] min-h-0 flex-row overflow-hidden">
          <div
            className="flex min-h-0 shrink-0 flex-col overflow-hidden border-r bg-gray-50/70"
            style={{ width: "30%", flexBasis: "30%" }}
          >
            <div className="px-4 py-3 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Questions</p>
              <p className="mt-1 text-xs text-gray-500">
                Select a question to view the answer key and candidate reports.
              </p>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="p-3 space-y-2">
                {isLoading && questions.length === 0 ? (
                  <div className="text-sm text-gray-500 px-2 py-2">Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div className="text-sm text-gray-500 px-2 py-2">No questions found.</div>
                ) : (
                  questions.map((q, index) => (
                    <button
                      key={q.id ?? `${q.question_text}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                        selectedIndex === index
                          ? "border-blue-200 bg-blue-50 text-blue-900"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">Q{index + 1}</span>
                        <div className="flex items-center gap-1">
                          {q.report_count > 0 ? (
                            <Badge variant="destructive" className="text-[10px]">
                              {q.report_count} report{q.report_count > 1 ? "s" : ""}
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {String(q.difficulty_level || "n/a")}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                        {q.question_text || "Untitled question"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {q.subject ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {String(q.subject)}
                          </Badge>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div
            className="min-w-0 flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{ width: "70%", flexBasis: "70%" }}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">Question {Math.min(selectedIndex + 1, Math.max(questions.length, 1))}</Badge>
                {selectedQuestion?.subject ? (
                  <Badge variant="secondary">{String(selectedQuestion.subject)}</Badge>
                ) : null}
                {selectedQuestion?.difficulty_level ? (
                  <Badge variant="outline" className="capitalize">
                    {String(selectedQuestion.difficulty_level)}
                  </Badge>
                ) : null}
                <Badge
                  variant={selectedQuestion?.report_count ? "destructive" : "outline"}
                  className="whitespace-nowrap"
                >
                  {selectedQuestion?.report_count ?? 0} candidate report
                  {(selectedQuestion?.report_count ?? 0) === 1 ? "" : "s"}
                </Badge>
                {isFetching && !isLoading ? (
                  <span className="text-xs text-gray-500">Refreshing...</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                  disabled={selectedIndex <= 0 || questions.length === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={questions.length === 0 || selectedIndex >= questions.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="p-5">
                {isLoading && questions.length === 0 ? (
                  <LoadingState />
                ) : error ? (
                  <ErrorState
                    message={error instanceof Error ? error.message : "Failed to load MCQ questions"}
                    onRetry={() => void refetch()}
                  />
                ) : !selectedQuestion ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-5">
                    <section className="rounded-lg border bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                        Question
                      </p>
                      <p className="text-sm leading-6 text-gray-900">
                        {selectedQuestion.question_text || "Question text not available"}
                      </p>
                    </section>

                    <section className="rounded-lg border bg-white p-4">
                      <div className="mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Options
                        </p>
                      </div>

                      {parsedOptions.length > 0 ? (
                        <div className="space-y-2">
                          {parsedOptions.map((option, index) => {
                            const isCorrect = index === correctAnswerInfo.index;
                            return (
                              <div
                                key={`${index}-${option}`}
                                className={`rounded-md border px-3 py-2 text-sm ${
                                  isCorrect
                                    ? "border-green-200 bg-green-50 text-green-900"
                                    : "border-gray-200 bg-gray-50 text-gray-700"
                                }`}
                              >
                                  <div className="flex items-start gap-2">
                                    <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                                    <span className="flex-1">{option}</span>
                                  </div>
                                </div>
                              );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                          Options not available for this question.
                        </div>
                      )}
                    </section>

                    <section className="rounded-lg border bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                        Candidate Reports
                      </p>
                      {(selectedQuestion.reports?.length ?? 0) > 0 ? (
                        <div className="space-y-3">
                          {selectedQuestion.reports.map((report, idx) => (
                            <QuestionReportCard key={report.id || `${report.application_id}-${idx}`} report={report} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No candidate issue reports were submitted for this question.
                        </p>
                      )}
                    </section>

                    {extraEntries.length > 0 ? (
                      <details className="rounded-lg border bg-white p-4">
                        <summary className="cursor-pointer text-sm font-medium text-gray-800">
                          Additional Question Details
                        </summary>
                        <div className="mt-3 space-y-2">
                          {extraEntries.map(([label, value]) => (
                            <div key={label} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                              <ReportValue value={value} />
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-lg border bg-white">
      <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading MCQ questions...
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-800">Failed to load questions</p>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-lg border bg-white px-6 text-center text-sm text-gray-500">
      No MCQ questions found for this job.
    </div>
  );
}

function normalizeOptions(rawOptions: unknown): string[] {
  if (Array.isArray(rawOptions)) {
    return rawOptions.map((value) => String(value));
  }

  if (typeof rawOptions === "string") {
    try {
      const parsed = JSON.parse(rawOptions);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => String(value));
      }
    } catch {
      return [];
    }
  }

  return [];
}

function getCorrectAnswerInfo(question: JobMCQRecord | undefined, options: string[]) {
  if (!question) return { index: -1, label: "" };

  const raw = question.correct_answer;
  const rawString = raw == null ? "" : String(raw).trim();
  if (!rawString) return { index: -1, label: "" };

  const numericIndex = Number.parseInt(rawString, 10);
  if (Number.isFinite(numericIndex) && String(numericIndex) === rawString) {
    if (numericIndex >= 0 && numericIndex < options.length) {
      return {
        index: numericIndex,
        label: `${String.fromCharCode(65 + numericIndex)}. ${options[numericIndex]}`,
      };
    }
  }

  const matchedIndex = options.findIndex((opt) => opt.trim() === rawString);
  if (matchedIndex >= 0) {
    return {
      index: matchedIndex,
      label: `${String.fromCharCode(65 + matchedIndex)}. ${options[matchedIndex]}`,
    };
  }

  return { index: -1, label: rawString };
}

function extractExtraEntries(question: JobMCQRecord | undefined): Array<[string, unknown]> {
  if (!question) return [];

  const hiddenKeys = new Set([
    "id",
    "job_id",
    "question_text",
    "options",
    "correct_answer",
    "subject",
    "difficulty_level",
    "created_at",
    "question_index",
    "reports",
    "report_count",
    "source_questionnaire_id",
    "updated_at",
  ]);

  return Object.entries(question)
    .filter(([key, value]) => !hiddenKeys.has(key) && value != null && String(value).trim() !== "")
    .slice(0, 12)
    .map(([key, value]) => [toLabel(key), value]);
}

function toLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ReportValue({ value }: { value: unknown }) {
  if (value == null) return <p className="text-sm text-gray-500">Not available</p>;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return <p className="text-sm text-gray-500">Not available</p>;
    return <p className="text-sm whitespace-pre-wrap leading-6 text-gray-800">{trimmed}</p>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <p className="text-sm text-gray-800">{String(value)}</p>;
  }

  return (
    <pre className="overflow-x-auto rounded bg-white p-2 text-xs text-gray-700 border">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function QuestionReportCard({ report }: { report: MCQQuestionReport }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-amber-300 text-amber-800 bg-white">
          {report.reason || "Issue reported"}
        </Badge>
        {report.created_at ? (
          <span className="text-xs text-gray-600">{formatReportDate(report.created_at)}</span>
        ) : null}
      </div>

      {report.details ? (
        <p className="mt-2 text-sm leading-6 text-gray-800 whitespace-pre-wrap">{report.details}</p>
      ) : (
        <p className="mt-2 text-sm text-gray-500">No additional details provided.</p>
      )}

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
        <span>
          Candidate:{" "}
          <span className="font-medium text-gray-800">
            {report.applicant_name || "Unknown candidate"}
          </span>
        </span>
        {report.applicant_email ? (
          <span>
            Email: <span className="font-medium text-gray-800">{report.applicant_email}</span>
          </span>
        ) : null}
        <span>Application: {shortId(report.application_id)}</span>
        {report.applicant_id ? <span>Applicant ID: {shortId(report.applicant_id)}</span> : null}
      </div>
    </div>
  );
}

function shortId(value: string) {
  if (!value) return "N/A";
  return value.length <= 12 ? value : `${value.slice(0, 8)}...`;
}

function formatReportDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
