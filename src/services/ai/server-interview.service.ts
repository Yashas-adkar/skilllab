import {
  InterviewPhase,
  InterviewTurnResponse,
  INTERVIEW_PHASE_NAMES,
  TurnEvaluation,
} from '@/types/interview-chat.types';
import { getStreamById, getDefaultStream } from '@/config/streams';
import { UserProfile } from '@/types/auth.types';
import {
  InterviewAnalyzerService,
  AnswerAnalysisResult,
} from './interview-analyzer.service';

export interface TurnContext {
  sessionId: string;
  streamId: string;
  userMessage: string;
  currentPhase: InterviewPhase;
  profile?: UserProfile | null;
  history?: Array<{ sender: 'ai' | 'candidate'; text: string; evaluation?: TurnEvaluation }>;
  maxUnansweredAllowed?: number; // Configurable threshold (default 3)
}

export class ServerInterviewService {
  /**
   * Process an interview turn with deep answer analysis before generating next question
   */
  static async processTurn(context: TurnContext): Promise<InterviewTurnResponse> {
    const {
      streamId,
      userMessage,
      currentPhase,
      profile,
      history = [],
      maxUnansweredAllowed = 3,
    } = context;

    const stream = getStreamById(streamId) || getDefaultStream();
    const candidateName = profile?.name || 'Candidate';
    const targetRole = profile?.profileInformation?.headline || stream.shortName;

    // Retrieve previous question from history if available
    const lastAiTurn = [...history].reverse().find((h) => h.sender === 'ai');
    const previousQuestion = lastAiTurn ? lastAiTurn.text : 'Welcome and Introduction';

    // Count previous unanswered turns
    const unansweredCount = history.filter(
      (h) => h.sender === 'candidate' && h.evaluation?.answerStatus === 'unanswered'
    ).length;

    let analysis: AnswerAnalysisResult | undefined;
    let evaluation: TurnEvaluation | undefined;

    // Analyze answer if user provided a response
    if (userMessage && userMessage.trim().length > 0) {
      analysis = InterviewAnalyzerService.analyzeAnswer({
        question: previousQuestion,
        answer: userMessage,
        streamId,
        phase: currentPhase,
        profile,
        unansweredCountSoFar: unansweredCount,
        maxUnansweredThreshold: maxUnansweredAllowed,
      });

      evaluation = analysis.evaluation;
    }

    // Determine next phase (progresses sequentially from 1 to 8, or concludes if threshold met)
    let nextPhase: InterviewPhase = currentPhase;
    if (userMessage && userMessage.trim().length > 0) {
      if (analysis?.shouldConcludeEarly) {
        nextPhase = 8;
      } else {
        nextPhase = Math.min(8, currentPhase + 1) as InterviewPhase;
      }
    }

    const isConcluded =
      (nextPhase === 8 && userMessage.trim().length > 0) || analysis?.shouldConcludeEarly === true;
    const phaseName = INTERVIEW_PHASE_NAMES[nextPhase];

    // Check if an external AI API key is configured
    const apiKey = process.env.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey && analysis) {
      try {
        const aiResponse = await this.callAIProvider(apiKey, {
          candidateName,
          targetRole,
          streamName: stream.name,
          skills: profile?.skills || stream.recommendedSkills.slice(0, 5),
          currentPhase: nextPhase,
          phaseName,
          userMessage,
          analysis,
          history: history.map((h) => ({ sender: h.sender, text: h.text })),
        });

        if (aiResponse) {
          return {
            reply: aiResponse,
            currentPhase: nextPhase,
            phaseName,
            isConcluded,
            evaluation,
          };
        }
      } catch (err) {
        console.warn('Live AI provider call failed, falling back to structured contextual engine:', err);
      }
    }

    // Built-in intelligent contextual response engine
    const reply = this.generateContextualQuestion({
      candidateName,
      targetRole,
      streamId,
      streamName: stream.name,
      skills: profile?.skills || stream.recommendedSkills.slice(0, 5),
      currentPhase: nextPhase,
      userMessage,
      analysis,
    });

    return {
      reply,
      currentPhase: nextPhase,
      phaseName,
      isConcluded,
      evaluation,
    };
  }

  /**
   * Generates stream-specific, contextual, and intellectually challenging questions
   * adapting dynamically to the candidate's answer status
   */
  private static generateContextualQuestion(params: {
    candidateName: string;
    targetRole: string;
    streamId: string;
    streamName: string;
    skills: string[];
    currentPhase: InterviewPhase;
    userMessage: string;
    analysis?: AnswerAnalysisResult;
  }): string {
    const { candidateName, targetRole, streamId, currentPhase, skills, userMessage, analysis } = params;
    const primarySkill = skills[0] || 'software development';

    // Base acknowledgement from answer analysis engine
    const ack = analysis?.interviewerAcknowledgement ? `${analysis.interviewerAcknowledgement} ` : '';

    switch (currentPhase) {
      case 1:
        return `Hello ${candidateName}! Welcome to your technical mock interview for the ${targetRole} track. I am Dr. Elena Vance, your AI Technical Evaluator today. We'll be assessing your core foundation, architectural reasoning, and practical problem-solving. To start, could you briefly introduce yourself and share what motivated you to specialize in ${params.streamName}?`;

      case 2:
        // Transition from intro/foundation
        return `${ack}Looking at your technical foundation with ${primarySkill}, could you describe a core principle or abstraction in your daily workflow that you consider critical for building resilient systems?`;

      case 3:
        if (streamId === 'ai_ml') {
          return `${ack}Let's dive into your machine learning projects. When training complex models or fine-tuning neural networks, what specific metrics (beyond raw accuracy) do you monitor to diagnose overfitting or data distribution drift?`;
        } else if (streamId === 'data_science') {
          return `${ack}Looking at your data analysis projects: When designing end-to-end data pipelines, how do you handle schema evolution and late-arriving records without corrupting downstream analytical dashboards?`;
        } else {
          return `${ack}Let's discuss your engineering projects. Walk me through a recent project you built using ${primarySkill}. Specifically, what was the most demanding architectural decision you had to make, and what alternatives did you reject?`;
        }

      case 4:
        // Technical Domain Core
        if (streamId === 'ai_ml') {
          return `${ack}Here is a technical concept question: In Transformer architectures, self-attention has an O(N^2) memory and compute complexity with sequence length N. What mathematical or architectural optimizations (like FlashAttention or Sparse Attention) address this bottleneck, and what are their trade-offs?`;
        } else if (streamId === 'data_science') {
          return `${ack}Technical fundamentals: Can you explain Simpson's Paradox? Describe a realistic scenario in product experimentation where an aggregated metric suggests one conclusion, but segmenting the data reveals the opposite effect.`;
        } else {
          return `${ack}Technical fundamentals: In high-scale data storage, what are the fundamental differences between B-Tree indexes (common in relational databases like PostgreSQL) and Log-Structured Merge (LSM) Trees (common in Cassandra or RocksDB)? When would you choose one over the other?`;
        }

      case 5:
        // Tricky / Intellectual Problem-Solving Scenario
        if (streamId === 'ai_ml') {
          return `${ack}Here is a tricky scenario: Suppose your Retrieval-Augmented Generation (RAG) pipeline frequently outputs hallucinated answers even though your vector database successfully retrieves the exact reference documents with high cosine similarity. How would you systematically debug this? Is it an embedding misalignment, chunking issue, context window compression problem, or LLM prompt instruction deficit?`;
        } else if (streamId === 'data_science') {
          return `${ack}Tricky experimentation challenge: You run an A/B test for a new checkout flow. The conversion rate shows a statistically significant increase of +3.5% (p = 0.01), but average order value and overall net revenue decreased by 5%. The growth team wants to ship the feature immediately based on the conversion win. How do you evaluate this tradeoff, and what would you recommend?`;
        } else {
          return `${ack}Here is a challenging scenario: Imagine your distributed service uses a cache-aside pattern with Redis. During a viral traffic event, a popular cache key expires, resulting in thousands of concurrent requests all hitting your primary relational database simultaneously (Cache Stampede / Thundering Herd), spiking CPU to 100%. How would you re-architect the caching layer to prevent this catastrophic failure?`;
        }

      case 6:
        // Adaptive Follow-up based on candidate's answer status
        if (analysis?.evaluation.answerStatus === 'unanswered') {
          return `${ack}Since we skipped that scenario, let's look at a fundamental reliability question: How do you implement automated health checks and circuit breakers in your microservices?`;
        } else if (analysis?.evaluation.answerStatus === 'partially_correct') {
          return `${ack}To probe a bit further on your previous point: How would your approach hold up under network partitions (split-brain scenarios) or asynchronous replication lag across multi-region datacenters?`;
        } else {
          return `${ack}Let's probe an edge case: How would your proposed design hold up under high concurrency when two distributed nodes write to the same key simultaneously?`;
        }

      case 7:
        // Behavioral / Engineering Leadership
        return `${ack}Let's transition to engineering collaboration and technical leadership: Tell me about a time you had a strong technical disagreement with a colleague or team lead regarding architecture or technical debt. How did you articulate your perspective, and what was the resolution?`;

      case 8:
      default:
        if (analysis?.shouldConcludeEarly) {
          return `${ack}Thank you for your participation today, ${candidateName}. We have gathered sufficient data points across the evaluated competencies to generate your readiness profile. That concludes our interview session today.`;
        }
        return `${ack}Thank you, ${candidateName}. You've completed our structured interview rounds across architectural design, domain principles, and engineering problem solving. That concludes our interview questions today! We will now compile your comprehensive interview evaluation report.`;
    }
  }

  /**
   * Calls an external AI Provider (Gemini / OpenAI compatible) with explicit instructions
   * derived from the answer analysis
   */
  private static async callAIProvider(
    apiKey: string,
    context: {
      candidateName: string;
      targetRole: string;
      streamName: string;
      skills: string[];
      currentPhase: InterviewPhase;
      phaseName: string;
      userMessage: string;
      analysis: AnswerAnalysisResult;
      history: Array<{ sender: 'ai' | 'candidate'; text: string }>;
    }
  ): Promise<string | null> {
    try {
      const isUnanswered = context.analysis.evaluation.answerStatus === 'unanswered';
      const prompt = `You are Dr. Elena Vance, a senior technical interviewer conducting a technical mock interview for a candidate named ${context.candidateName} targeting a ${context.targetRole} role in ${context.streamName}.
Candidate skills: ${context.skills.join(', ')}.
Current Phase: Phase ${context.currentPhase} (${context.phaseName}).
Candidate's latest response: "${context.userMessage}".
Evaluator Analysis:
- Status: ${context.analysis.evaluation.answerStatus}
- Did candidate answer: ${!isUnanswered}
- Feedback: ${context.analysis.evaluation.feedback}

CRITICAL INSTRUCTIONS:
1. ${
        isUnanswered
          ? 'The candidate explicitly could not or did not answer the question. DO NOT say "Thank you for your answer" or "Thank you for your introduction". Acknowledge their inability professionally (e.g., "I understand. Let\'s move to our next topic.") and proceed directly to the next question.'
          : 'Acknowledge their answer naturally based on whether it was correct or partially correct, without revealing full solutions.'
      }
2. Ask exactly ONE thoughtful, intellectually challenging question for Phase ${context.currentPhase}.
3. Keep tone professional, rigorous, and supportive.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch {
      // Fallback
    }
    return null;
  }
}
