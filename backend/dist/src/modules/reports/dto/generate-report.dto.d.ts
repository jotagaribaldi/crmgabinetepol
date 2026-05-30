export declare enum ReportFormat {
    CSV = "csv",
    XLSX = "xlsx"
}
export declare enum ReportType {
    VOTERS = "voters",
    VOTERS_BY_REGION = "voters_by_region",
    VOTERS_BY_SEGMENT = "voters_by_segment",
    VOTERS_BY_MUNICIPALITY = "voters_by_municipality",
    LEADERS_PERFORMANCE = "leaders_performance",
    AUDIT_SUMMARY = "audit_summary"
}
export declare class GenerateReportDto {
    type: ReportType;
    format: ReportFormat;
    dateFrom?: string;
    dateTo?: string;
    regionId?: string;
    segmentId?: string;
    municipalityId?: string;
}
