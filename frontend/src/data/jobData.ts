export interface Skill {
    id: string;
    name: string;
    icon: string;
    sfia: number;
    status: 'mastered' | 'learning' | 'locked';
    subSkills: string[];
    desc: string;
    // Layout properties (optional, calculated at runtime)
    x?: number;
    y?: number;
    subSkillPositions?: { name: string; x: number; y: number }[];
}

export interface JobDetail {
    name: string;
    cat: string;
    sfia: number;
    skills: Skill[];
    edges: [string, string][];
}

export const JOB_DATA: Record<string, JobDetail> = {
    python_dev: {
        name: 'Python Developer', cat: 'softdev', sfia: 3,
        skills: [
            { id: 'python_ds', name: 'Python (Data Structures)', icon: 'code', sfia: 2, status: 'mastered', subSkills: ['Lists/Dicts', 'Sets/Tuples', 'Comprehensions', 'Generators'], desc: 'Advanced data structures in Python.' },
            { id: 'statistics', name: 'Statistics', icon: 'bar-chart-2', sfia: 2, status: 'mastered', subSkills: ['Probability', 'Distributions', 'Hypothesis Testing'], desc: 'Statistical foundations for data science.' },
            { id: 'ml_basics', name: 'ML Basics', icon: 'brain', sfia: 3, status: 'learning', subSkills: ['Supervised', 'Unsupervised', 'Evaluation'], desc: 'Core machine learning concepts.' },
            { id: 'visualization', name: 'Data Visualization', icon: 'pie-chart', sfia: 2, status: 'mastered', subSkills: ['Matplotlib', 'Seaborn', 'Plotly'], desc: 'Visualizing data insights.' },
            { id: 'sql_ds', name: 'SQL for DS', icon: 'database', sfia: 2, status: 'learning', subSkills: ['Joins', 'Aggregations', 'Window Functions'], desc: 'Database querying for data analysis.' },
            { id: 'feature_eng', name: 'Feature Engineering', icon: 'sliders', sfia: 3, status: 'learning', subSkills: ['Scaling', 'Encoding', 'Selection'], desc: 'Preparing data for models.' },
            { id: 'nlp_ds', name: 'NLP Basics', icon: 'message-square', sfia: 3, status: 'locked', subSkills: ['Tokenization', 'Embeddings', 'Transformers'], desc: 'Natural Language Processing fundamentals.' },
            { id: 'experiment', name: 'Experiment Design', icon: 'flask-conical', sfia: 3, status: 'learning', subSkills: ['A/B Testing', 'Sample Size', 'Bias'], desc: 'Designing valid experiments.' },
            { id: 'deep_learning', name: 'Deep Learning', icon: 'layers', sfia: 4, status: 'locked', subSkills: ['NNs', 'CNNs', 'RNNs', 'Backprop'], desc: 'Neural networks and deep learning.' },
            { id: 'big_data', name: 'Big Data', icon: 'server', sfia: 3, status: 'locked', subSkills: ['Spark', 'Hadoop', 'Distributed'], desc: 'Handling large-scale datasets.' },
            { id: 'mlops', name: 'MLOps', icon: 'settings', sfia: 4, status: 'locked', subSkills: ['Deployment', 'Monitoring', 'Pipelines'], desc: 'Machine learning operations.' },
            { id: 'domain', name: 'Domain Knowledge', icon: 'briefcase', sfia: 2, status: 'learning', subSkills: ['Finance', 'Healthcare', 'Retail'], desc: 'Industry-specific knowledge.' },
        ],
        edges: [
            ['python_ds', 'statistics'], ['statistics', 'ml_basics'], ['python_ds', 'visualization'],
            ['python_ds', 'sql_ds'], ['ml_basics', 'feature_eng'], ['ml_basics', 'deep_learning'],
            ['statistics', 'experiment'], ['sql_ds', 'big_data'], ['deep_learning', 'nlp_ds'],
            ['feature_eng', 'mlops'], ['ml_basics', 'domain'], ['big_data', 'mlops'],
        ]
    },
    devops: {
        name: 'DevOps Engineer', cat: 'infra', sfia: 3,
        skills: [
            { id: 'linux_do', name: 'Linux', icon: 'terminal', sfia: 1, status: 'mastered', subSkills: ['Shell', 'Permissions', 'systemd'], desc: 'Linux administration.' },
            { id: 'docker_do', name: 'Docker', icon: 'container', sfia: 2, status: 'mastered', subSkills: ['Images', 'Compose', 'Registry'], desc: 'Container management.' },
            { id: 'k8s', name: 'Kubernetes', icon: 'ship', sfia: 3, status: 'learning', subSkills: ['Pods', 'Services', 'Helm', 'Operators'], desc: 'Container orchestration.' },
            { id: 'cicd', name: 'CI/CD', icon: 'git-merge', sfia: 2, status: 'learning', subSkills: ['GitHub Actions', 'Jenkins', 'ArgoCD'], desc: 'Continuous integration and delivery.' },
            { id: 'terraform', name: 'IaC / Terraform', icon: 'file-code', sfia: 3, status: 'learning', subSkills: ['Modules', 'State', 'Providers'], desc: 'Infrastructure as Code.' },
            { id: 'cloud_do', name: 'Cloud (AWS/GCP)', icon: 'cloud', sfia: 2, status: 'learning', subSkills: ['EC2/GCE', 'S3', 'IAM', 'VPC'], desc: 'Cloud infrastructure management.' },
            { id: 'monitoring_do', name: 'Monitoring', icon: 'activity', sfia: 2, status: 'learning', subSkills: ['Prometheus', 'Grafana', 'Alerting'], desc: 'Infrastructure monitoring.' },
            { id: 'networking', name: 'Networking', icon: 'network', sfia: 2, status: 'learning', subSkills: ['DNS', 'Load Balancing', 'VPN'], desc: 'Network fundamentals.' },
            { id: 'security_do', name: 'Security', icon: 'shield', sfia: 3, status: 'locked', subSkills: ['Secrets', 'Scanning', 'Compliance'], desc: 'DevSecOps practices.' },
            { id: 'gitops', name: 'GitOps', icon: 'git-branch', sfia: 3, status: 'locked', subSkills: ['ArgoCD', 'Flux', 'Declarative'], desc: 'Git-driven operations.' },
            { id: 'scripting', name: 'Scripting', icon: 'scroll', sfia: 1, status: 'mastered', subSkills: ['Bash', 'Python', 'Automation'], desc: 'Automation scripting.' },
            { id: 'sre_prac', name: 'SRE Practices', icon: 'heart-pulse', sfia: 4, status: 'locked', subSkills: ['SLO/SLI', 'Error Budgets', 'Incident Mgmt'], desc: 'Site reliability engineering.' },
        ],
        edges: [
            ['linux_do', 'docker_do'], ['docker_do', 'k8s'], ['k8s', 'cicd'],
            ['cicd', 'terraform'], ['terraform', 'cloud_do'], ['cloud_do', 'networking'],
            ['docker_do', 'monitoring_do'], ['k8s', 'security_do'], ['cicd', 'gitops'],
            ['scripting', 'cicd'], ['monitoring_do', 'sre_prac'], ['networking', 'security_do'],
        ]
    },
};

// Fallback: generate a generic job for any unspecified job ID
export function getGenericJob(jobId: string): JobDetail {
    const name = jobId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return {
        name, cat: 'softdev', sfia: 2,
        skills: [
            { id: 's1', name: 'Core Concepts', icon: 'book', sfia: 1, status: 'mastered', subSkills: ['Basics', 'Theory'], desc: 'Fundamental concepts.' },
            { id: 's2', name: 'Skill 2', icon: 'code', sfia: 2, status: 'learning', subSkills: ['Sub A', 'Sub B'], desc: 'Key skill area.' },
            { id: 's3', name: 'Skill 3', icon: 'wrench', sfia: 2, status: 'learning', subSkills: ['Sub C'], desc: 'Applied skill.' },
            { id: 's4', name: 'Advanced', icon: 'rocket', sfia: 3, status: 'locked', subSkills: ['Deep', 'Expert'], desc: 'Advanced topics.' },
        ],
        edges: [['s1', 's2'], ['s2', 's3'], ['s3', 's4']]
    };
}
