import { CareerStream } from '@/types/stream.types';

export const CAREER_STREAMS: CareerStream[] = [
  {
    id: 'cs_se',
    name: 'Computer Science & Software Engineering',
    shortName: 'Software Engineering',
    tagline: 'Full-Stack, Backend, Systems & Distributed Architectures',
    description: 'Master technical interviews for Software Engineer, Backend Engineer, and Full-Stack Developer roles at top tech companies.',
    icon: 'Terminal',
    accentColor: '#3b82f6', // Blue
    recommendedSkills: [
      'Data Structures & Algorithms',
      'System Design',
      'TypeScript / JavaScript',
      'Python',
      'Java / Go / C++',
      'REST & GraphQL APIs',
      'SQL / NoSQL Databases',
      'Distributed Systems',
      'Docker & CI/CD',
    ],
    focusAreas: [
      'Algorithmic Efficiency (O(N) complexities)',
      'High-concurrency & scalability tradeoffs',
      'Object-Oriented & functional design patterns',
      'Database indexing & caching strategies',
    ],
    resumeCriteria: [
      { name: 'Core CS Foundations', weight: 25, description: 'Algorithms, OS, networking, databases' },
      { name: 'Production Project Impact', weight: 30, description: 'Quantified metrics, scale, architecture' },
      { name: 'Modern Tech Stack Depth', weight: 25, description: 'Proficiency in modern frameworks & tools' },
      { name: 'Code Quality & Testing', weight: 20, description: 'Unit tests, CI/CD, maintainability' },
    ],
    aptitudeFocus: ['Probability & Combinatorics', 'Logical Sequences', 'Graph & Network Traversal Math', 'Binary Operations'],
    codingTopics: ['Dynamic Programming', 'Graph Theory', 'Trees & Heaps', 'Concurrency', 'Sliding Window'],
    interviewDomains: ['System Architecture', 'API Design', 'Production Incident Debugging', 'Behavioral Leadership'],
  },
  {
    id: 'ai_ml',
    name: 'AI & Machine Learning Engineering',
    shortName: 'AI & Machine Learning',
    tagline: 'Deep Learning, LLMs, Computer Vision & MLOps Pipelines',
    description: 'Prepare for Machine Learning Engineer, Applied AI Scientist, and AI Systems Engineer interviews with mathematical and practical rigor.',
    icon: 'Cpu',
    accentColor: '#8b5cf6', // Violet
    recommendedSkills: [
      'PyTorch / TensorFlow',
      'Deep Learning & Transformers',
      'LLMs & Prompt Engineering',
      'Vector Databases & RAG',
      'Linear Algebra & Calculus',
      'Model Optimization & Quantization',
      'MLflow & MLOps',
      'Python & NumPy / Pandas',
    ],
    focusAreas: [
      'Neural network architectures (CNNs, RNNs, Attention)',
      'Training stability, overfitting & regularization',
      'Model inference latency & quantization',
      'RAG pipeline design & evaluation metrics',
    ],
    resumeCriteria: [
      { name: 'Mathematical & ML Rigor', weight: 30, description: 'Loss functions, optimization, calculus' },
      { name: 'Applied Model Implementations', weight: 30, description: 'Fine-tuning, deployment, inference' },
      { name: 'Data Pipeline & MLOps', weight: 20, description: 'Feature engineering, monitoring, vector search' },
      { name: 'Academic / Open Source Research', weight: 20, description: 'Papers, Kaggle, GitHub contributions' },
    ],
    aptitudeFocus: ['Bayesian Probability', 'Matrix Transformations', 'Information Theory', 'Optimization Calculus'],
    codingTopics: ['Custom Tensor Operations', 'Attention Mechanism Implementation', 'Tree Ensemble From Scratch', 'Loss Function Derivatives'],
    interviewDomains: ['Model Tradeoffs & Bias', 'LLM Agent Architectures', 'Distributed Training (DDP/FSDP)', 'ML System Design'],
  },
  {
    id: 'data_science',
    name: 'Data Science & Advanced Analytics',
    shortName: 'Data Science',
    tagline: 'Statistical Modeling, Experimentation, ETL & Business Insights',
    description: 'Ace Data Scientist, Quantitative Analyst, and Analytics Engineer interviews with statistical modeling and hypothesis testing focus.',
    icon: 'BarChart3',
    accentColor: '#06b6d4', // Cyan
    recommendedSkills: [
      'Statistical Inference & Hypothesis Testing',
      'A/B Testing & Causal Inference',
      'Advanced SQL & Window Functions',
      'Python & R',
      'Pandas, Polars, Scikit-Learn',
      'Data Visualization (Tableau, Seaborn)',
      'ETL & Data Warehousing (Snowflake, BigQuery)',
      'Predictive Modeling & Time Series',
    ],
    focusAreas: [
      'A/B experiment sample sizing & p-value pitfalls',
      'Feature selection & dimensionality reduction (PCA)',
      'Complex SQL query optimization and aggregations',
      'Translating ambiguous business metrics to ML problems',
    ],
    resumeCriteria: [
      { name: 'Statistical & Causal Depth', weight: 30, description: 'Hypothesis testing, variance reduction' },
      { name: 'Data Wrangling & SQL Mastery', weight: 25, description: 'Complex ETL pipelines, query optimization' },
      { name: 'Predictive Modeling Competence', weight: 25, description: 'Regression, classification, clustering' },
      { name: 'Business Translation & Storytelling', weight: 20, description: 'Actionable executive insights & metrics' },
    ],
    aptitudeFocus: ['Hypothesis Testing Math', 'Conditional Expectation', 'Combinatorics & Sampling', 'Regression Analysis'],
    codingTopics: ['Advanced Data Transformation (Polars/Pandas)', 'Matrix Inversion & Least Squares', 'Custom Bootstrap Sampling', 'Time Series Feature Generation'],
    interviewDomains: ['A/B Testing Strategy', 'Metric Selection & Cannibalization', 'Anomaly Detection Systems', 'Data Ethics'],
  },
];

export function getStreamById(id: string): CareerStream | undefined {
  return CAREER_STREAMS.find((s) => s.id === id);
}

export function getDefaultStream(): CareerStream {
  return CAREER_STREAMS[0];
}
