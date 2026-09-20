export type AptitudeCategory =
  | 'Logical Reasoning'
  | 'Quantitative Aptitude'
  | 'Verbal Reasoning'
  | 'Technical Aptitude'
  | 'Problem Solving';

export interface AptitudeQuestion {
  id: string;
  category: AptitudeCategory;
  streamId: 'cs_se' | 'ai_ml' | 'data_science' | 'all';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const APTITUDE_CATEGORIES: AptitudeCategory[] = [
  'Logical Reasoning',
  'Quantitative Aptitude',
  'Verbal Reasoning',
  'Technical Aptitude',
  'Problem Solving',
];

export const APTITUDE_QUESTION_BANK: AptitudeQuestion[] = [
  // ================= LOGICAL REASONING =================
  {
    id: 'lr_1',
    category: 'Logical Reasoning',
    streamId: 'all',
    difficulty: 'medium',
    question: 'In a certain cipher, GRAPH is encoded as JUDSK. How is NODES encoded in that same cipher?',
    options: ['PQGHV', 'QPGHV', 'QPGVH', 'PQGVH'],
    correctIndex: 1,
    explanation:
      'Each letter is shifted forward by 3 positions in the alphabet: G(+3)=J, R(+3)=U, A(+3)=D, P(+3)=S, H(+3)=K. Applying this to NODES: N(+3)=Q, O(+3)=P, D(+3)=G, E(+3)=H, S(+3)=V, yielding QPGHV.',
  },
  {
    id: 'lr_2',
    category: 'Logical Reasoning',
    streamId: 'all',
    difficulty: 'easy',
    question: 'Find the missing number in the series: 3, 7, 15, 31, 63, ?',
    options: ['125', '127', '129', '131'],
    correctIndex: 1,
    explanation:
      'Each number follows the pattern 2n + 1 (or adding powers of 2: +4, +8, +16, +32, +64). Thus, 63 * 2 + 1 = 127.',
  },
  {
    id: 'lr_3',
    category: 'Logical Reasoning',
    streamId: 'all',
    difficulty: 'medium',
    question:
      'Statements: (1) All microservices are decoupled. (2) Some decoupled systems use event streaming. Which conclusion logically follows?',
    options: [
      'All microservices use event streaming.',
      'Some microservices may use event streaming.',
      'No microservices use event streaming.',
      'Event streaming requires monolithic architecture.',
    ],
    correctIndex: 1,
    explanation:
      'Since all microservices are decoupled and some decoupled systems use event streaming, it is logically valid that some microservices may use event streaming, while not guaranteed for all.',
  },
  {
    id: 'lr_4',
    category: 'Logical Reasoning',
    streamId: 'cs_se',
    difficulty: 'medium',
    question:
      'Five developers—A, B, C, D, and E—work in a sprint. B completes after A. C completes before A. D completes after E but before B. If E completes after A, who finishes third?',
    options: ['Developer A', 'Developer B', 'Developer D', 'Developer E'],
    correctIndex: 3,
    explanation:
      'From the conditions: C < A (C completes before A). Since E completes after A and D completes after E, we have C < A < E < D. Furthermore, D is before B, so the full order is C < A < E < D < B. The third person to finish is E.',
  },
  {
    id: 'lr_5',
    category: 'Logical Reasoning',
    streamId: 'ai_ml',
    difficulty: 'hard',
    question:
      'If all neural classifiers are parametric estimators, and no non-differentiable model is a parametric estimator, which statement must be FALSE?',
    options: [
      'Some neural classifiers are non-differentiable.',
      'All neural classifiers are differentiable.',
      'No neural classifier is non-differentiable.',
      'Some parametric estimators are neural classifiers.',
    ],
    correctIndex: 0,
    explanation:
      'Since all neural classifiers are parametric estimators and NO non-differentiable model is a parametric estimator, neural classifiers and non-differentiable models are mutually disjoint. Therefore, "Some neural classifiers are non-differentiable" is false.',
  },
  {
    id: 'lr_6',
    category: 'Logical Reasoning',
    streamId: 'data_science',
    difficulty: 'medium',
    question:
      'If event A implies event B, and not B is observed, what can we definitively conclude using modus tollens?',
    options: ['Event A occurred', 'Event A did not occur', 'Event B may occur later', 'Nothing can be deduced'],
    correctIndex: 1,
    explanation:
      'Modus tollens states that if P implies Q, then the negation of Q implies the negation of P (not B implies not A). Therefore, Event A did not occur.',
  },

  // ================= QUANTITATIVE APTITUDE =================
  {
    id: 'qa_1',
    category: 'Quantitative Aptitude',
    streamId: 'all',
    difficulty: 'medium',
    question:
      'A server processes 1,200 requests per minute with an average processing time of 50ms per request. If incoming load increases by 25%, how many requests per minute must the system sustain?',
    options: ['1,400 req/min', '1,500 req/min', '1,600 req/min', '1,800 req/min'],
    correctIndex: 1,
    explanation:
      'A 25% increase on 1,200 requests/minute is 1,200 + (0.25 * 1,200) = 1,200 + 300 = 1,500 requests per minute.',
  },
  {
    id: 'qa_2',
    category: 'Quantitative Aptitude',
    streamId: 'all',
    difficulty: 'easy',
    question:
      'Two database replicas sync data. Replica A syncs at 60 MB/s and Replica B syncs at 40 MB/s. If they sync a 600 MB snapshot concurrently from split partitions, how long does the complete transfer take?',
    options: ['5 seconds', '6 seconds', '10 seconds', '15 seconds'],
    correctIndex: 1,
    explanation:
      'Combined throughput is 60 MB/s + 40 MB/s = 100 MB/s. For 600 MB, the total time required is 600 MB / 100 MB/s = 6 seconds.',
  },
  {
    id: 'qa_3',
    category: 'Quantitative Aptitude',
    streamId: 'cs_se',
    difficulty: 'medium',
    question:
      'A cache has a 90% hit rate with a 2ms hit latency and a 50ms miss latency to the database. What is the effective average memory access time (AMAT)?',
    options: ['5.0 ms', '6.8 ms', '7.2 ms', '8.0 ms'],
    correctIndex: 1,
    explanation:
      'AMAT = (Hit Rate * Hit Time) + (Miss Rate * Miss Time) = (0.90 * 2ms) + (0.10 * 50ms) = 1.8ms + 5.0ms = 6.8 ms.',
  },
  {
    id: 'qa_4',
    category: 'Quantitative Aptitude',
    streamId: 'ai_ml',
    difficulty: 'hard',
    question:
      'In a binary classification dataset of 1,000 instances, 100 are positive. A model predicts positive for 150 instances, of which 80 are true positives. What is the precision of the model?',
    options: ['53.3%', '80.0%', '88.9%', '75.0%'],
    correctIndex: 0,
    explanation:
      'Precision = True Positives / (True Positives + False Positives) = TP / Total Predicted Positives = 80 / 150 = 53.33%. (Recall would be 80/100 = 80%).',
  },
  {
    id: 'qa_5',
    category: 'Quantitative Aptitude',
    streamId: 'data_science',
    difficulty: 'medium',
    question:
      'What is the probability of rolling a sum of 8 with two fair standard 6-sided dice?',
    options: ['5/36', '6/36', '7/36', '4/36'],
    correctIndex: 0,
    explanation:
      'There are 36 total outcomes. The combinations that sum to 8 are: (2,6), (3,5), (4,4), (5,3), (6,2), which are 5 outcomes. Hence the probability is 5/36 (~13.89%).',
  },
  {
    id: 'qa_6',
    category: 'Quantitative Aptitude',
    streamId: 'all',
    difficulty: 'medium',
    question:
      'A cloud storage bucket offers a 20% discount on usage over 50 TB. If the standard rate is $0.020 per GB ($20/TB) and a company consumes 75 TB, what is their total monthly bill?',
    options: ['$1,200', '$1,400', '$1,500', '$1,350'],
    correctIndex: 1,
    explanation:
      'First 50 TB is charged at full price: 50 * $20 = $1,000. Remaining 25 TB gets 20% discount ($16/TB): 25 * $16 = $400. Total = $1,000 + $400 = $1,400.',
  },

  // ================= VERBAL REASONING =================
  {
    id: 'vr_1',
    category: 'Verbal Reasoning',
    streamId: 'all',
    difficulty: 'easy',
    question:
      'Choose the word that best completes the sentence: "The engineering team designed the distributed architecture with high fault-tolerance, ______ ensuring zero downtime during node failures."',
    options: ['thereby', 'nonetheless', 'conversely', 'haphazardly'],
    correctIndex: 0,
    explanation:
      '"Thereby" means "by that means, as a result of that", which logically links the design choice (high fault-tolerance) to the resulting benefit (zero downtime).',
  },
  {
    id: 'vr_2',
    category: 'Verbal Reasoning',
    streamId: 'all',
    difficulty: 'medium',
    question:
      'Identify the best antonym for the term EPHEMERAL in the context of persistent software architecture:',
    options: ['Transient', 'Enduring', 'Volatile', 'Intermittent'],
    correctIndex: 1,
    explanation:
      'Ephemeral means lasting for a very short time or temporary (like ephemeral containers). The antonym is enduring (permanent, persistent).',
  },
  {
    id: 'vr_3',
    category: 'Verbal Reasoning',
    streamId: 'cs_se',
    difficulty: 'medium',
    question:
      'Analogies: "COMPILER is to EXECUTABLE" as "BLUEPRINT is to ______":',
    options: ['Architect', 'Building', 'Draft', 'Permit'],
    correctIndex: 1,
    explanation:
      'A compiler processes source code to produce an executable product, just as a blueprint is used to construct a finished building.',
  },
  {
    id: 'vr_4',
    category: 'Verbal Reasoning',
    streamId: 'ai_ml',
    difficulty: 'medium',
    question:
      'Which word accurately conveys an AI model that appears convincing and fluent while generating factually unsubstantiated claims?',
    options: ['Deterministic', 'Hallucinatory', 'Optimized', 'Isomorphic'],
    correctIndex: 1,
    explanation:
      'In generative AI, generating convincing yet incorrect or unsubstantiated content is termed "hallucinatory" (model hallucination).',
  },
  {
    id: 'vr_5',
    category: 'Verbal Reasoning',
    streamId: 'data_science',
    difficulty: 'medium',
    question:
      'Read the statement: "Correlation does not imply causation." Which of the following is the most valid deduction?',
    options: [
      'Correlated variables never influence one another.',
      'Observing a statistical relationship between two variables is insufficient evidence that one causes the other.',
      'Causation can never be proven with observational data.',
      'Uncorrelated variables may still have a 100% causal link.',
    ],
    correctIndex: 1,
    explanation:
      'The maxim warns that statistical correlation alone cannot confirm a direct cause-and-effect relationship, often due to confounding variables or coincidence.',
  },

  // ================= TECHNICAL APTITUDE =================
  {
    id: 'ta_1',
    category: 'Technical Aptitude',
    streamId: 'all',
    difficulty: 'medium',
    question:
      'What is the worst-case time complexity of searching an element in an unbalanced Binary Search Tree with N nodes?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correctIndex: 2,
    explanation:
      'In the worst case, an unbalanced BST degenerates into a linear linked list (skewed tree), making the worst-case search complexity O(N).',
  },
  {
    id: 'ta_2',
    category: 'Technical Aptitude',
    streamId: 'cs_se',
    difficulty: 'medium',
    question:
      'Which HTTP response status code is most appropriate when a client sends valid syntax but the server refuses action due to insufficient authorization credentials?',
    options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
    correctIndex: 2,
    explanation:
      'HTTP 403 Forbidden signifies that the server understood the request and authenticated the client, but the client does not have permission to access the requested resource. (401 is used when authentication itself is missing or invalid).',
  },
  {
    id: 'ta_3',
    category: 'Technical Aptitude',
    streamId: 'cs_se',
    difficulty: 'hard',
    question:
      'In relational databases, which ACID property guarantees that multiple concurrent transactions execute without leaving the database in an inconsistent intermediate state?',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correctIndex: 2,
    explanation:
      'Isolation ensures that concurrently executing transactions cannot observe each other\'s partial or uncommitted states, preventing race conditions such as dirty reads or non-repeatable reads.',
  },
  {
    id: 'ta_4',
    category: 'Technical Aptitude',
    streamId: 'ai_ml',
    difficulty: 'medium',
    question:
      'What issue occurs during deep neural network backpropagation when gradients scaled across many layers shrink exponentially towards zero?',
    options: ['Exploding Gradients', 'Vanishing Gradients', 'Dead Neurons', 'Covariate Shift'],
    correctIndex: 1,
    explanation:
      'The vanishing gradient problem occurs when successive chain-rule multiplications with values < 1 cause gradients to approach zero, halting weight updates in earlier layers.',
  },
  {
    id: 'ta_5',
    category: 'Technical Aptitude',
    streamId: 'data_science',
    difficulty: 'medium',
    question:
      'In SQL, which clause is required to filter aggregated groups created by a GROUP BY clause?',
    options: ['WHERE', 'ORDER BY', 'HAVING', 'FILTER'],
    correctIndex: 2,
    explanation:
      'The HAVING clause filters aggregated rows produced by GROUP BY, whereas the WHERE clause filters individual rows before aggregation takes place.',
  },
  {
    id: 'ta_6',
    category: 'Technical Aptitude',
    streamId: 'all',
    difficulty: 'easy',
    question:
      'What data structure implements the First-In, First-Out (FIFO) access pattern?',
    options: ['Stack', 'Queue', 'Heap', 'Trie'],
    correctIndex: 1,
    explanation:
      'A Queue operates on a First-In, First-Out (FIFO) basis, where elements are enqueued at the back and dequeued from the front. Stacks use LIFO.',
  },

  // ================= PROBLEM SOLVING =================
  {
    id: 'ps_1',
    category: 'Problem Solving',
    streamId: 'all',
    difficulty: 'medium',
    question:
      'You are given 8 identical-looking microchips, exactly one of which is defective and slightly heavier than the others. Using a two-pan balance scale, what is the minimum number of weighings guaranteed to find the defective chip?',
    options: ['1 weighing', '2 weighings', '3 weighings', '4 weighings'],
    correctIndex: 1,
    explanation:
      'Using ternary search: divide the 8 chips into groups of 3, 3, and 2. Weigh 3 vs 3. If they balance, the heavy chip is in the 2 remaining (weigh 1 vs 1 to find it in weighing 2). If one group of 3 is heavier, take those 3 chips, weigh 1 vs 1 (if balance, the 3rd is heavy; otherwise the heavier pan wins). Maximum 2 weighings guaranteed.',
  },
  {
    id: 'ps_2',
    category: 'Problem Solving',
    streamId: 'cs_se',
    difficulty: 'medium',
    question:
      'A distributed system needs to schedule recurring jobs while preventing duplicate executions across 5 active worker replicas. Which mechanism is most effective?',
    options: [
      'Have each replica check its local clock every 10 seconds',
      'Use a distributed lock (e.g., Redis Redlock or ZooKeeper lease) with a time-to-live',
      'Increase thread sleep duration on non-primary workers',
      'Restart the cluster after every job execution',
    ],
    correctIndex: 1,
    explanation:
      'A distributed lock with a TTL guarantees mutual exclusion across nodes even in network partition edge cases, preventing multiple workers from running identical scheduled tasks concurrently.',
  },
  {
    id: 'ps_3',
    category: 'Problem Solving',
    streamId: 'ai_ml',
    difficulty: 'hard',
    question:
      'Your RAG system suffers from low retrieval accuracy because user queries are short questions whereas knowledge base chunks are dense technical documentation. What strategy directly bridges this semantic gap?',
    options: [
      'Increase temperature to 1.0',
      'Hypothetical Document Embeddings (HyDE) or query expansion with an LLM',
      'Reduce the vector database index size',
      'Truncate all documentation chunks to 20 words',
    ],
    correctIndex: 1,
    explanation:
      'HyDE prompts an LLM to generate a hypothetical answer to the query first, then embeds that hypothetical document. This projects the short question into the same semantic space as the dense target documents, drastically boosting cosine retrieval accuracy.',
  },
  {
    id: 'ps_4',
    category: 'Problem Solving',
    streamId: 'data_science',
    difficulty: 'medium',
    question:
      'An e-commerce company notices that users who receive promotional push notifications have a 25% higher purchase rate than users who do not. However, only users who actively opened the app in the last 7 days were eligible for notifications. What bias is present?',
    options: ['Survivorship bias', 'Selection bias / Confounding', 'Recall bias', 'Observer-expectancy effect'],
    correctIndex: 1,
    explanation:
      'This is classic selection bias and confounding: the treatment group was pre-selected based on active user behavior (already highly engaged users), confounding engagement with notification impact.',
  },
  {
    id: 'ps_5',
    category: 'Problem Solving',
    streamId: 'all',
    difficulty: 'easy',
    question:
      'You need to find a single target element in a sorted list of 1,024 elements. What is the maximum number of comparisons required using binary search?',
    options: ['10 comparisons', '32 comparisons', '512 comparisons', '1,024 comparisons'],
    correctIndex: 0,
    explanation:
      'Binary search operates in O(log2 N) comparisons. Since 2^10 = 1,024, the maximum number of comparisons needed is log2(1,024) = 10 comparisons.',
  },
  {
    id: 'ps_6',
    category: 'Problem Solving',
    streamId: 'cs_se',
    difficulty: 'medium',
    question:
      'A microservice receives bursts of 10,000 incoming requests per second, but downstream payment gateway can only handle 500 requests per second. Which architectural pattern prevents downstream outage while retaining requests?',
    options: [
      'Circuit breaker pattern with immediate failure return',
      'Asynchronous message queue buffer with rate-limited worker consumers',
      'Synchronous retry loop in the client browser',
      'Horizontal auto-scaling of the payment gateway directly',
    ],
    correctIndex: 1,
    explanation:
      'A message queue (e.g. RabbitMQ, Kafka) acts as a shock absorber / buffer, holding the burst traffic while worker processes consume and dispatch payments at the strictly bounded rate of 500 req/sec.',
  },
];

/**
 * Selects exactly 10 aptitude questions distributed across the 5 categories,
 * tailored to the candidate's career stream, avoiding recently answered questions.
 */
export function selectAptitudeQuestions(
  streamId: string,
  count: number = 10,
  excludedIds: string[] = []
): AptitudeQuestion[] {
  // 1. Filter bank by stream relevance
  const streamPool = APTITUDE_QUESTION_BANK.filter(
    (q) => q.streamId === streamId || q.streamId === 'all'
  );

  // Fallback to full bank if stream pool is small
  const pool = streamPool.length >= count ? streamPool : APTITUDE_QUESTION_BANK;

  // 2. Separate into fresh (unattempted) vs previously attempted
  const excludedSet = new Set(excludedIds);
  const freshQuestions = pool.filter((q) => !excludedSet.has(q.id));
  const candidatePool = freshQuestions.length >= count ? freshQuestions : pool;

  // 3. Ensure representation across all 5 categories
  const selected: AptitudeQuestion[] = [];
  const selectedIds = new Set<string>();

  // Determine target per category (e.g. 10 / 5 = 2 per category)
  const targetPerCategory = Math.max(1, Math.floor(count / APTITUDE_CATEGORIES.length));

  for (const category of APTITUDE_CATEGORIES) {
    const categoryQuestions = candidatePool
      .filter((q) => q.category === category && !selectedIds.has(q.id))
      .sort(() => Math.random() - 0.5);

    const pick = categoryQuestions.slice(0, targetPerCategory);
    pick.forEach((q) => {
      selected.push(q);
      selectedIds.add(q.id);
    });
  }

  // Fill remaining slots up to count from any available questions in candidatePool
  if (selected.length < count) {
    const remaining = candidatePool
      .filter((q) => !selectedIds.has(q.id))
      .sort(() => Math.random() - 0.5);

    for (const q of remaining) {
      if (selected.length >= count) break;
      selected.push(q);
      selectedIds.add(q.id);
    }
  }

  // If still less than count (rare), draw from full pool
  if (selected.length < count) {
    const fallback = APTITUDE_QUESTION_BANK
      .filter((q) => !selectedIds.has(q.id))
      .sort(() => Math.random() - 0.5);

    for (const q of fallback) {
      if (selected.length >= count) break;
      selected.push(q);
      selectedIds.add(q.id);
    }
  }

  // Shuffle the selected 10 questions for realistic test experience
  return selected.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Get question by ID
 */
export function getAptitudeQuestionById(id: string): AptitudeQuestion | undefined {
  return APTITUDE_QUESTION_BANK.find((q) => q.id === id);
}
