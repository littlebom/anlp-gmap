export interface IGraphNode {
    id: string;
    label: string;
    description?: string;
    category?: string;
    sfia_level?: number;
    source?: 'ESCO' | 'ONET' | 'LIGHTCAST' | 'PDF' | 'AI';
    metadata?: any;
}

export interface IGraphEdge {
    source: string;
    target: string;
    relation?: string;
}

export interface IGraphResult {
    nodes: IGraphNode[];
    edges: IGraphEdge[];
    metadata?: {
        generatedAt: Date;
        jobTitle: string;
    };
}
