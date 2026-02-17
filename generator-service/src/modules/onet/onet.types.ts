export interface IONETSearchResult {
    code: string;
    title: string;
    href: string;
    score: number;
}

export interface IONETTechnology {
    id: string;
    name: string;
}

export interface IONETTool {
    id: string;
    name: string;
}

export interface IONETTask {
    id: number;
    name: string;
}

export interface IONETOccupation {
    code: string;
    title: string;
    description: string;
    sample_of_reported_job_titles: { title: string[] };
}
