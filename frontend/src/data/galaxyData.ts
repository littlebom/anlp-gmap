// ============================================================
//  Mock Data — ย้ายจาก mockup_galaxy.html
//  จะถูกแทนที่ด้วย API call ใน Phase 4
// ============================================================

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    x: number;
    y: number;
}

export interface Job {
    id: string;
    name: string;
    cat: string;
    skills: number;
    topSkills: string[];
    x: number;
    y: number;
}

export interface SharedLink {
    from: string;
    to: string;
    shared: number;
    top: string;
}

export interface WithinSharedLink {
    a: string;
    b: string;
    shared: number;
    top: string;
}

export const CATEGORIES: Category[] = [
    { id: 'softdev', name: 'Software Development', color: '#38bdf8', icon: 'code', x: 550, y: 350 },
    { id: 'data', name: 'Data & AI', color: '#a78bfa', icon: 'brain', x: 1000, y: 320 },
    { id: 'infra', name: 'Infrastructure & Cloud', color: '#34d399', icon: 'cloud', x: 1380, y: 500 },
    { id: 'security', name: 'Cybersecurity', color: '#f87171', icon: 'shield', x: 1400, y: 900 },
    { id: 'design', name: 'Design & UX', color: '#fbbf24', icon: 'pen-tool', x: 450, y: 880 },
    { id: 'pm', name: 'Product & Management', color: '#4ade80', icon: 'clipboard-list', x: 850, y: 1050 },
    { id: 'qa', name: 'Quality & Testing', color: '#22d3ee', icon: 'test-tubes', x: 1200, y: 1020 },
    { id: 'acad', name: 'Education & Research', color: '#e879f9', icon: 'graduation-cap', x: 800, y: 650 },
];

const RAW_JOBS: Omit<Job, 'x' | 'y'>[] = [
    // Software Dev
    { id: 'python_dev', name: 'Python Developer', cat: 'softdev', skills: 24, topSkills: ['OOP', 'Flask', 'Testing', 'SQL', 'Git'] },
    { id: 'frontend_dev', name: 'Frontend Developer', cat: 'softdev', skills: 26, topSkills: ['React', 'TypeScript', 'CSS', 'Testing', 'Git'] },
    { id: 'backend_dev', name: 'Backend Developer', cat: 'softdev', skills: 25, topSkills: ['Django', 'API Design', 'SQL', 'Docker', 'Auth'] },
    { id: 'fullstack', name: 'Fullstack Developer', cat: 'softdev', skills: 30, topSkills: ['React', 'Node.js', 'SQL', 'Docker', 'Git'] },
    { id: 'mobile_dev', name: 'Mobile Developer', cat: 'softdev', skills: 22, topSkills: ['Flutter', 'Swift', 'OOP', 'REST API', 'CI/CD'] },
    { id: 'game_dev', name: 'Game Developer', cat: 'softdev', skills: 20, topSkills: ['Unity', 'C#', 'Physics', 'OOP', 'Shaders'] },
    { id: 'embedded', name: 'Embedded Engineer', cat: 'softdev', skills: 18, topSkills: ['C/C++', 'RTOS', 'Hardware', 'Linux', 'Testing'] },
    // Data & AI
    { id: 'data_sci', name: 'Data Scientist', cat: 'data', skills: 28, topSkills: ['Python', 'Statistics', 'ML', 'SQL', 'Visualization'] },
    { id: 'ml_eng', name: 'ML Engineer', cat: 'data', skills: 26, topSkills: ['PyTorch', 'MLOps', 'Python', 'Docker', 'Cloud'] },
    { id: 'data_eng', name: 'Data Engineer', cat: 'data', skills: 24, topSkills: ['Spark', 'SQL', 'Airflow', 'Python', 'Cloud'] },
    { id: 'data_analyst', name: 'Data Analyst', cat: 'data', skills: 18, topSkills: ['SQL', 'Excel', 'Tableau', 'Statistics', 'Python'] },
    { id: 'ai_research', name: 'AI Researcher', cat: 'data', skills: 22, topSkills: ['Deep Learning', 'Math', 'Python', 'Papers', 'NLP'] },
    { id: 'nlp_eng', name: 'NLP Engineer', cat: 'data', skills: 20, topSkills: ['Transformers', 'Python', 'Linguistics', 'ML', 'Cloud'] },
    // Infra
    { id: 'devops', name: 'DevOps Engineer', cat: 'infra', skills: 22, topSkills: ['Docker', 'K8s', 'CI/CD', 'Linux', 'Terraform'] },
    { id: 'sre', name: 'SRE', cat: 'infra', skills: 20, topSkills: ['Monitoring', 'Linux', 'K8s', 'Python', 'Incident Mgmt'] },
    { id: 'cloud_arch', name: 'Cloud Architect', cat: 'infra', skills: 24, topSkills: ['AWS/GCP/Azure', 'Networking', 'Security', 'Terraform', 'Cost Mgmt'] },
    { id: 'sys_admin', name: 'System Admin', cat: 'infra', skills: 18, topSkills: ['Linux', 'Networking', 'Scripting', 'Backup', 'Security'] },
    { id: 'net_eng', name: 'Network Engineer', cat: 'infra', skills: 16, topSkills: ['TCP/IP', 'Routing', 'Firewalls', 'VPN', 'Monitoring'] },
    { id: 'platform', name: 'Platform Engineer', cat: 'infra', skills: 21, topSkills: ['K8s', 'IaC', 'CI/CD', 'Docker', 'Observability'] },
    // Security
    { id: 'sec_analyst', name: 'Security Analyst', cat: 'security', skills: 18, topSkills: ['SIEM', 'Threat Analysis', 'Compliance', 'Networking', 'Forensics'] },
    { id: 'pen_tester', name: 'Penetration Tester', cat: 'security', skills: 20, topSkills: ['Kali', 'OWASP', 'Scripting', 'Networking', 'Reporting'] },
    { id: 'sec_arch', name: 'Security Architect', cat: 'security', skills: 22, topSkills: ['IAM', 'Cloud Security', 'Encryption', 'Architecture', 'Compliance'] },
    { id: 'soc_analyst', name: 'SOC Analyst', cat: 'security', skills: 16, topSkills: ['SIEM', 'Incident Response', 'Monitoring', 'Triage', 'Reporting'] },
    { id: 'forensics', name: 'Digital Forensics', cat: 'security', skills: 15, topSkills: ['Disk Analysis', 'Memory Forensics', 'Chain of Custody', 'Malware', 'Reporting'] },
    // Design
    { id: 'ui_designer', name: 'UI Designer', cat: 'design', skills: 16, topSkills: ['Figma', 'Design Systems', 'Typography', 'Color Theory', 'Prototyping'] },
    { id: 'ux_designer', name: 'UX Designer', cat: 'design', skills: 18, topSkills: ['User Research', 'Wireframing', 'Usability Testing', 'Figma', 'IA'] },
    { id: 'ux_research', name: 'UX Researcher', cat: 'design', skills: 14, topSkills: ['Interviews', 'Survey Design', 'A/B Testing', 'Analytics', 'Reporting'] },
    { id: 'graphic', name: 'Graphic Designer', cat: 'design', skills: 15, topSkills: ['Photoshop', 'Illustrator', 'Branding', 'Layout', 'Print'] },
    { id: 'motion', name: 'Motion Designer', cat: 'design', skills: 14, topSkills: ['After Effects', 'Animation', 'Storyboarding', '3D', 'Video'] },
    // PM
    { id: 'prod_mgr', name: 'Product Manager', cat: 'pm', skills: 15, topSkills: ['Roadmapping', 'Stakeholders', 'Analytics', 'Agile', 'Strategy'] },
    { id: 'proj_mgr', name: 'Project Manager', cat: 'pm', skills: 14, topSkills: ['Gantt', 'Risk Mgmt', 'Budget', 'Communication', 'Agile'] },
    { id: 'scrum_master', name: 'Scrum Master', cat: 'pm', skills: 12, topSkills: ['Scrum', 'Facilitation', 'Kanban', 'Coaching', 'Metrics'] },
    { id: 'tech_lead', name: 'Tech Lead', cat: 'pm', skills: 20, topSkills: ['Architecture', 'Code Review', 'Mentoring', 'Agile', 'System Design'] },
    { id: 'eng_mgr', name: 'Engineering Manager', cat: 'pm', skills: 18, topSkills: ['1:1s', 'Hiring', 'Performance', 'Strategy', 'Agile'] },
    // QA
    { id: 'qa_eng', name: 'QA Engineer', cat: 'qa', skills: 19, topSkills: ['Test Planning', 'Manual Testing', 'Bug Tracking', 'SQL', 'API Testing'] },
    { id: 'qa_auto', name: 'QA Automation', cat: 'qa', skills: 20, topSkills: ['Selenium', 'Cypress', 'CI/CD', 'Python', 'Test Frameworks'] },
    { id: 'perf_eng', name: 'Performance Engineer', cat: 'qa', skills: 17, topSkills: ['JMeter', 'Load Testing', 'Profiling', 'Monitoring', 'Optimization'] },
    { id: 'qa_lead', name: 'QA Lead', cat: 'qa', skills: 16, topSkills: ['Strategy', 'Team Mgmt', 'Metrics', 'Process', 'Automation'] },
    // Education
    { id: 'instructor', name: 'Tech Instructor', cat: 'acad', skills: 14, topSkills: ['Pedagogy', 'Curriculum', 'Presentation', 'LMS', 'Assessment'] },
    { id: 'curriculum', name: 'Curriculum Designer', cat: 'acad', skills: 12, topSkills: ['Learning Design', 'Bloom Taxonomy', 'Assessment', 'EdTech', 'Writing'] },
    { id: 'edtech', name: 'EdTech Developer', cat: 'acad', skills: 18, topSkills: ['React', 'LMS Integration', 'API', 'UX', 'Python'] },
    { id: 'researcher', name: 'CS Researcher', cat: 'acad', skills: 16, topSkills: ['LaTeX', 'Statistics', 'Python', 'Literature Review', 'Experimentation'] },
];

export const SHARED_LINKS: SharedLink[] = [
    { from: 'softdev', to: 'data', shared: 15, top: 'Python, Git, SQL' },
    { from: 'softdev', to: 'infra', shared: 12, top: 'Linux, Docker, CI/CD' },
    { from: 'softdev', to: 'qa', shared: 10, top: 'Testing, Git, Automation' },
    { from: 'softdev', to: 'security', shared: 8, top: 'Auth, Encryption, OWASP' },
    { from: 'softdev', to: 'design', shared: 6, top: 'HTML/CSS, Prototyping' },
    { from: 'softdev', to: 'pm', shared: 7, top: 'Agile, Communication' },
    { from: 'data', to: 'infra', shared: 9, top: 'Python, Cloud, Pipelines' },
    { from: 'data', to: 'acad', shared: 8, top: 'Statistics, Research, Python' },
    { from: 'data', to: 'qa', shared: 5, top: 'Automation, Scripting' },
    { from: 'infra', to: 'security', shared: 11, top: 'Networking, IAM, Monitoring' },
    { from: 'infra', to: 'qa', shared: 6, top: 'CI/CD, Monitoring, Docker' },
    { from: 'design', to: 'pm', shared: 7, top: 'User Research, Communication' },
    { from: 'design', to: 'acad', shared: 4, top: 'Presentation, Pedagogy' },
    { from: 'pm', to: 'qa', shared: 5, top: 'Agile, Metrics, Reporting' },
    { from: 'pm', to: 'acad', shared: 4, top: 'Communication, Planning' },
    { from: 'security', to: 'qa', shared: 4, top: 'Pen Testing, Automation' },
];

// Within-category shared skills (between job pairs)
export const WITHIN_SHARED: Record<string, WithinSharedLink[]> = {
    softdev: [
        { a: 'python_dev', b: 'backend_dev', shared: 12, top: 'OOP, SQL, Git, Testing' },
        { a: 'python_dev', b: 'fullstack', shared: 10, top: 'OOP, SQL, Git, API' },
        { a: 'frontend_dev', b: 'fullstack', shared: 14, top: 'React, TypeScript, CSS, Git' },
        { a: 'backend_dev', b: 'fullstack', shared: 13, top: 'SQL, Docker, API, Auth' },
        { a: 'python_dev', b: 'mobile_dev', shared: 6, top: 'OOP, REST API, CI/CD' },
        { a: 'game_dev', b: 'mobile_dev', shared: 5, top: 'OOP, UI, Performance' },
        { a: 'embedded', b: 'backend_dev', shared: 4, top: 'Linux, Testing, C/C++' },
    ],
    data: [
        { a: 'data_sci', b: 'ml_eng', shared: 15, top: 'Python, ML, Statistics, Cloud' },
        { a: 'data_sci', b: 'data_eng', shared: 10, top: 'Python, SQL, Cloud' },
        { a: 'data_sci', b: 'data_analyst', shared: 9, top: 'SQL, Statistics, Visualization' },
        { a: 'ml_eng', b: 'ai_research', shared: 11, top: 'Deep Learning, Python, Math' },
        { a: 'ml_eng', b: 'nlp_eng', shared: 10, top: 'Transformers, Python, ML' },
        { a: 'data_eng', b: 'data_analyst', shared: 7, top: 'SQL, Python, Data Pipelines' },
        { a: 'ai_research', b: 'nlp_eng', shared: 8, top: 'NLP, Deep Learning, Python' },
    ],
    infra: [
        { a: 'devops', b: 'sre', shared: 12, top: 'K8s, Linux, Monitoring, CI/CD' },
        { a: 'devops', b: 'platform', shared: 14, top: 'K8s, Docker, CI/CD, IaC' },
        { a: 'devops', b: 'cloud_arch', shared: 10, top: 'Terraform, Cloud, K8s' },
        { a: 'sre', b: 'sys_admin', shared: 8, top: 'Linux, Monitoring, Networking' },
        { a: 'cloud_arch', b: 'net_eng', shared: 6, top: 'Networking, Security, Cloud' },
        { a: 'sys_admin', b: 'net_eng', shared: 7, top: 'Networking, Linux, Security' },
    ],
    security: [
        { a: 'sec_analyst', b: 'soc_analyst', shared: 10, top: 'SIEM, Threat Analysis, Monitoring' },
        { a: 'sec_analyst', b: 'forensics', shared: 7, top: 'Forensics, Reporting, Malware' },
        { a: 'pen_tester', b: 'sec_arch', shared: 8, top: 'OWASP, Networking, Encryption' },
        { a: 'sec_arch', b: 'sec_analyst', shared: 6, top: 'Compliance, IAM, Architecture' },
        { a: 'soc_analyst', b: 'forensics', shared: 5, top: 'Incident Response, Triage' },
    ],
    design: [
        { a: 'ui_designer', b: 'ux_designer', shared: 10, top: 'Figma, Prototyping, User Research' },
        { a: 'ui_designer', b: 'graphic', shared: 6, top: 'Typography, Color Theory, Layout' },
        { a: 'ux_designer', b: 'ux_research', shared: 9, top: 'User Research, Usability Testing' },
        { a: 'graphic', b: 'motion', shared: 5, top: 'Design Tools, Visual Design' },
    ],
    pm: [
        { a: 'prod_mgr', b: 'proj_mgr', shared: 7, top: 'Agile, Stakeholders, Communication' },
        { a: 'prod_mgr', b: 'tech_lead', shared: 6, top: 'Strategy, Architecture, Agile' },
        { a: 'tech_lead', b: 'eng_mgr', shared: 9, top: 'Mentoring, Code Review, Agile' },
        { a: 'proj_mgr', b: 'scrum_master', shared: 6, top: 'Agile, Facilitation, Metrics' },
        { a: 'eng_mgr', b: 'prod_mgr', shared: 5, top: 'Strategy, Hiring, Performance' },
    ],
    qa: [
        { a: 'qa_eng', b: 'qa_auto', shared: 11, top: 'Test Planning, Bug Tracking, API Testing' },
        { a: 'qa_eng', b: 'qa_lead', shared: 7, top: 'Strategy, Metrics, Process' },
        { a: 'qa_auto', b: 'perf_eng', shared: 6, top: 'CI/CD, Automation, Profiling' },
        { a: 'qa_lead', b: 'qa_auto', shared: 5, top: 'Automation, Strategy, Metrics' },
    ],
    acad: [
        { a: 'instructor', b: 'curriculum', shared: 8, top: 'Pedagogy, Assessment, LMS' },
        { a: 'curriculum', b: 'edtech', shared: 5, top: 'EdTech, LMS, Learning Design' },
        { a: 'instructor', b: 'edtech', shared: 4, top: 'LMS, Presentation, EdTech' },
        { a: 'researcher', b: 'instructor', shared: 3, top: 'Statistics, Python, Writing' },
    ],
};

// Layout jobs around their category center
function layoutJobs(): Job[] {
    return RAW_JOBS.map((job) => {
        const cat = CATEGORIES.find((c) => c.id === job.cat)!;
        const jobsInCat = RAW_JOBS.filter((j) => j.cat === job.cat);
        const idx = jobsInCat.indexOf(job);
        const angle = (idx / jobsInCat.length) * Math.PI * 2 - Math.PI / 2;
        const r = 100 + (idx % 2) * 50;
        return {
            ...job,
            x: cat.x + Math.cos(angle) * r,
            y: cat.y + Math.sin(angle) * r,
        };
    });
}

export const JOBS: Job[] = layoutJobs();

// Stats helpers
export const STATS = {
    totalJobs: JOBS.length,
    totalCategories: CATEGORIES.length,
    totalSharedSkills: SHARED_LINKS.reduce((s, l) => s + l.shared, 0),
    totalSkills: JOBS.reduce((s, j) => s + j.skills, 0),
};
