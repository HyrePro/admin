"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobOverviewAnalytics = void 0;
var React = require("react");
var client_1 = require("@/lib/supabase/api/client");
var get_mcq_assessment_analytics_1 = require("@/lib/supabase/api/get-mcq-assessment-analytics");
var total_analytics_1 = require("@/components/total-analytics");
var assessment_analytics_1 = require("@/components/assessment-analytics");
var interview_analytics_1 = require("@/components/interview-analytics");
var demo_analytics_1 = require("@/components/demo-analytics");
var get_demo_analytics_1 = require("@/lib/supabase/api/get-demo-analytics");
var get_interview_analytics_1 = require("@/lib/supabase/api/get-interview-analytics");
var chartConfig = {
    passed: {
        label: "Passed",
        color: "#10b981", // Green
    },
    failed: {
        label: "Failed",
        color: "#ef4444", // Red
    },
    scheduled: {
        label: "Scheduled",
        color: "#f59e0b", // Amber
    },
    completed: {
        label: "Completed",
        color: "#8b5cf6", // Violet
    },
    total: {
        label: "Total",
        color: "#3b82f6", // Blue
    },
    assessment: {
        label: "Assessment",
        color: "#3b82f6", // Blue
    },
    demo: {
        label: "Demo",
        color: "#10b981", // Green
    },
    interview: {
        label: "Interview",
        color: "#f59e0b", // Amber
    },
    hired: {
        label: "Hired",
        color: "#8b5cf6", // Violet
    },
    dropoff: {
        label: "Drop-off",
        color: "#6b7280", // Gray
    },
    avg_percentage: {
        label: "Average Percentage",
        color: "#8b5cf6", // Violet
    },
};
var JobOverviewAnalyticsComponent = function (_a) {
    var jobId = _a.jobId;
    var _b = React.useState(null), overviewData = _b[0], setOverviewData = _b[1];
    var _c = React.useState(null), funnelData = _c[0], setFunnelData = _c[1];
    var _d = React.useState(null), demographicsData = _d[0], setDemographicsData = _d[1]; // Will contain gender and city distribution
    var _e = React.useState(null), mcqAssessmentData = _e[0], setMcqAssessmentData = _e[1];
    var _f = React.useState(null), demoAnalyticsData = _f[0], setDemoAnalyticsData = _f[1];
    var _g = React.useState(null), interviewAnalyticsData = _g[0], setInterviewAnalyticsData = _g[1];
    var _h = React.useState(true), loading = _h[0], setLoading = _h[1];
    var _j = React.useState(false), loadingAssessment = _j[0], setLoadingAssessment = _j[1];
    var _k = React.useState(false), loadingDemo = _k[0], setLoadingDemo = _k[1];
    var _l = React.useState(false), loadingInterview = _l[0], setLoadingInterview = _l[1];
    var _m = React.useState(null), error = _m[0], setError = _m[1];
    var _o = React.useState(null), assessmentError = _o[0], setAssessmentError = _o[1];
    var _p = React.useState(null), demoError = _p[0], setDemoError = _p[1];
    var _q = React.useState(null), interviewError = _q[0], setInterviewError = _q[1];
    var _r = React.useState('total'), selectedMetric = _r[0], setSelectedMetric = _r[1]; // Default to 'total'
    React.useEffect(function () {
        var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
            var supabase, _a, overviewData_1, overviewError, _b, funnelData_1, funnelError, processedOverviewData, processedFunnelData, hasOverviewData, hasFunnelData, mockDemographics, err_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setLoading(true);
                        setError(null);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, 5, 6]);
                        supabase = (0, client_1.createClient)();
                        return [4 /*yield*/, supabase
                                .rpc('get_job_analytics', {
                                p_job_id: jobId,
                                p_type: 'overview'
                            })];
                    case 2:
                        _a = _c.sent(), overviewData_1 = _a.data, overviewError = _a.error;
                        console.log('Component - Overview RPC response:', { data: overviewData_1, error: overviewError });
                        if (overviewError) {
                            console.error('Component - Overview RPC error:', overviewError);
                            throw new Error(overviewError.message || 'Failed to fetch overview analytics');
                        }
                        return [4 /*yield*/, supabase
                                .rpc('get_funnel_analytics', {
                                p_job_id: jobId
                            })];
                    case 3:
                        _b = _c.sent(), funnelData_1 = _b.data, funnelError = _b.error;
                        console.log('Component - Funnel RPC response:', { data: funnelData_1, error: funnelError });
                        if (funnelError) {
                            console.error('Component - Funnel RPC error:', funnelError);
                            throw new Error(funnelError.message || 'Failed to fetch funnel analytics');
                        }
                        processedOverviewData = overviewData_1 !== null && overviewData_1 !== void 0 ? overviewData_1 : null;
                        processedFunnelData = funnelData_1 !== null && funnelData_1 !== void 0 ? funnelData_1 : null;
                        console.log('Component - Processed overview data:', processedOverviewData);
                        console.log('Component - Processed funnel data:', processedFunnelData);
                        hasOverviewData = processedOverviewData !== null;
                        hasFunnelData = processedFunnelData !== null;
                        console.log('Component - Data availability check:', { hasOverviewData: hasOverviewData, hasFunnelData: hasFunnelData });
                        setOverviewData(hasOverviewData ? JSON.parse(JSON.stringify(processedOverviewData)) : null);
                        setFunnelData(hasFunnelData ? JSON.parse(JSON.stringify(processedFunnelData)) : null);
                        mockDemographics = {
                            gender: {
                                male: 45,
                                female: 32,
                                other: 5
                            },
                            city_distribution: {
                                'Bangalore': 18,
                                'Dharwad': 2,
                                'Hubballi': 2,
                                'Mysore': 7,
                                'Mangalore': 4,
                                'Chennai': 12
                            }
                        };
                        setDemographicsData(mockDemographics);
                        return [3 /*break*/, 6];
                    case 4:
                        err_1 = _c.sent();
                        console.error("Error fetching analytics:", err_1);
                        setError(err_1 instanceof Error ? err_1.message : "An unexpected error occurred");
                        return [3 /*break*/, 6];
                    case 5:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        if (jobId) {
            fetchData();
        }
    }, [jobId]);
    // Fetch MCQ assessment data when Assessment metric is selected
    React.useEffect(function () {
        if (selectedMetric === 'assessment' && jobId && !mcqAssessmentData) {
            var fetchAssessmentData = function () { return __awaiter(void 0, void 0, void 0, function () {
                var result, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setLoadingAssessment(true);
                            setAssessmentError(null);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, (0, get_mcq_assessment_analytics_1.getMcqAssessmentAnalytics)(jobId)];
                        case 2:
                            result = _a.sent();
                            if (result.error) {
                                console.error("Error fetching MCQ assessment data:", result.error);
                                setAssessmentError(result.error.message || "Failed to fetch assessment analytics");
                            }
                            else {
                                // Ensure data is properly serialized to avoid non-serializable object errors
                                setMcqAssessmentData(result.data ? JSON.parse(JSON.stringify(result.data)) : null);
                            }
                            return [3 /*break*/, 5];
                        case 3:
                            err_2 = _a.sent();
                            console.error("Error in fetching MCQ assessment data:", err_2);
                            setAssessmentError(err_2 instanceof Error ? err_2.message : "Failed to fetch assessment analytics");
                            return [3 /*break*/, 5];
                        case 4:
                            setLoadingAssessment(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            }); };
            fetchAssessmentData();
        }
    }, [selectedMetric, jobId, mcqAssessmentData]);
    // Fetch demo analytics data when Demo metric is selected
    React.useEffect(function () {
        if (selectedMetric === 'demo' && jobId && !demoAnalyticsData) {
            var fetchDemoData = function () { return __awaiter(void 0, void 0, void 0, function () {
                var result, err_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setLoadingDemo(true);
                            setDemoError(null);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, (0, get_demo_analytics_1.getDemoAnalytics)(jobId)];
                        case 2:
                            result = _a.sent();
                            if (result.error) {
                                console.error("Error fetching demo analytics data:", result.error);
                                setDemoError(result.error.message || "Failed to fetch demo analytics");
                            }
                            else {
                                // Ensure data is properly serialized to avoid non-serializable object errors
                                setDemoAnalyticsData(result.data ? JSON.parse(JSON.stringify(result.data)) : null);
                            }
                            return [3 /*break*/, 5];
                        case 3:
                            err_3 = _a.sent();
                            console.error("Error in fetching demo analytics data:", err_3);
                            setDemoError(err_3 instanceof Error ? err_3.message : "Failed to fetch demo analytics");
                            return [3 /*break*/, 5];
                        case 4:
                            setLoadingDemo(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            }); };
            fetchDemoData();
        }
    }, [selectedMetric, jobId, demoAnalyticsData]);
    // Fetch interview analytics data when Interview metric is selected
    React.useEffect(function () {
        if (selectedMetric === 'interview' && jobId && !interviewAnalyticsData) {
            var fetchInterviewData = function () { return __awaiter(void 0, void 0, void 0, function () {
                var result, err_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setLoadingInterview(true);
                            setInterviewError(null);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, (0, get_interview_analytics_1.getInterviewAnalytics)(jobId)];
                        case 2:
                            result = _a.sent();
                            if (result.error) {
                                console.error("Error fetching interview analytics data:", result.error);
                                setInterviewError(result.error.message || "Failed to fetch interview analytics");
                            }
                            else {
                                // Ensure data is properly serialized to avoid non-serializable object errors
                                setInterviewAnalyticsData(result.data ? JSON.parse(JSON.stringify(result.data)) : null);
                            }
                            return [3 /*break*/, 5];
                        case 3:
                            err_4 = _a.sent();
                            console.error("Error in fetching interview analytics data:", err_4);
                            setInterviewError(err_4 instanceof Error ? err_4.message : "Failed to fetch interview analytics");
                            return [3 /*break*/, 5];
                        case 4:
                            setLoadingInterview(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            }); };
            fetchInterviewData();
        }
    }, [selectedMetric, jobId, interviewAnalyticsData]);
    if (loading) {
        return (<div className="space-y-6">
        {/* Loading KPI metrics */}
        <div className="border-b">
          <div className="flex justify-between divide-x">
            {__spreadArray([], Array(4), true).map(function (_, i) { return (<div key={i} className="flex-1 p-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"/>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"/>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mt-2"/>
              </div>); })}
          </div>
        </div>
        
        {/* Loading chart */}
        <div className="h-[400px] bg-gray-200 animate-pulse"/>
      </div>);
    }
    if (error) {
        return (<div className="space-y-6">
        <div className="p-4 bg-red-50">
          <p className="text-red-800">Failed to load job analytics: {error}</p>
          <button onClick={function () { return window.location.reload(); }} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>);
    }
    if (!overviewData) {
        return (<div className="space-y-6">
        <div className="p-4 bg-yellow-50">
          <p className="text-yellow-800">No analytics data available for this job yet.</p>
          <p className="text-yellow-600 mt-2">Job ID: {jobId}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">Show Debug Info</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              <pre>Overview Data: {JSON.stringify(overviewData, null, 2)}</pre>
              <pre>Funnel Data: {JSON.stringify(funnelData, null, 2)}</pre>
            </div>
          </details>
          <button onClick={function () { return window.location.reload(); }} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>);
    }
    // Calculate pass rates based on overview data
    var assessmentPassRate = overviewData.total_applicants > 0
        ? ((overviewData.assessment_completed / overviewData.total_applicants) * 100).toFixed(1)
        : 0;
    var demoPassRate = overviewData.total_applicants > 0
        ? ((overviewData.demos_completed / overviewData.total_applicants) * 100).toFixed(1)
        : 0;
    var interviewCompletionRate = overviewData.total_applicants > 0
        ? ((overviewData.interviews_completed / overviewData.total_applicants) * 100).toFixed(1)
        : 0;
    return (<div className="h-full flex flex-col">
      {/* KPI metrics with common border and individual left borders */}
      <div className="shrink-0 border-b">
        <div className="flex justify-between divide-x">
          <div className={"flex-1 p-4 ".concat(selectedMetric === 'total' ? 'bg-blue-50' : 'hover:bg-gray-50', " cursor-pointer transition-colors")} onClick={function () { return setSelectedMetric('total'); }}>
            <h3 className="font-medium">Total</h3>
            <p className="text-2xl font-bold">
              {overviewData.total_applicants}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
          
          <div className={"flex-1 p-4 ".concat(selectedMetric === 'assessment' ? 'bg-blue-50' : 'hover:bg-gray-50', " cursor-pointer transition-colors")} onClick={function () { return setSelectedMetric('assessment'); }}>
            <h3 className="font-medium">Assessment</h3>
            <p className="text-2xl font-bold">
              {overviewData.assessment_completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
          
          <div className={"flex-1 p-4 ".concat(selectedMetric === 'demo' ? 'bg-blue-50' : 'hover:bg-gray-50', " cursor-pointer transition-colors")} onClick={function () { return setSelectedMetric('demo'); }}>
            <h3 className="font-medium">Demo</h3>
            <p className="text-2xl font-bold">
              {overviewData.demos_completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
          
          <div className={"flex-1 p-4 ".concat(selectedMetric === 'interview' ? 'bg-blue-50' : 'hover:bg-gray-50', " cursor-pointer transition-colors")} onClick={function () { return setSelectedMetric('interview'); }}>
            <h3 className="font-medium">Interview</h3>
            <p className="text-2xl font-bold">
              {overviewData.interviews_completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">
            </p>
          </div>
        </div>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto">
        <div className="pb-8">
          {selectedMetric === 'total' && (<total_analytics_1.TotalAnalytics funnelData={funnelData} loading={false} error={null}/>)}
          {selectedMetric === 'assessment' && (<assessment_analytics_1.AssessmentAnalytics jobId={jobId} chartConfig={chartConfig} mcqAssessmentData={mcqAssessmentData} loadingAssessment={loadingAssessment} setLoadingAssessment={setLoadingAssessment} errorAssessment={assessmentError}/>)}
          {selectedMetric === 'demo' && (<demo_analytics_1.DemoAnalytics jobId={jobId} chartConfig={chartConfig} demoAnalyticsData={demoAnalyticsData} loadingDemo={loadingDemo} setLoadingDemo={setLoadingDemo} errorDemo={demoError}/>)}
          {selectedMetric === 'interview' && (<interview_analytics_1.InterviewAnalytics jobId={jobId} chartConfig={chartConfig} interviewAnalyticsData={interviewAnalyticsData} loadingInterview={loadingInterview} setLoadingInterview={setLoadingInterview} errorInterview={interviewError}/>)}
        </div>
      </div>
    </div>);
};
exports.JobOverviewAnalytics = React.memo(JobOverviewAnalyticsComponent);
