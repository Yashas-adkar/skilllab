import {
  InterviewPhase,
  InterviewTurnResponse,
  INTERVIEW_PHASE_NAMES,
  TurnEvaluation,
} from '@/types/interview-chat.types';
import { getStreamById, getDefaultStream } from '@/config/streams';
import { UserProfile } from '@/types/auth.types';

export interface TurnContext {
  sessionId: string;
  streamId: string;
  userMessage: string;
  currentPhase: InterviewPhase;
  profile?: UserProfile | null;
  history?: Array<{ sender: 'ai' | 'candidate'; text: string }>;
}

export class ServerInterviewService {
  /**
   * Process an interview turn with contextual knowledge of the candidate
   */
  static async processTurn(context: TurnContext): Promise<InterviewTurnResponse> {
    const { streamId, userMessage, currentPhase, profile, history = [] } = context;
    const stream = getStreamById(streamId) || getDefaultStream();
    const candidateName = profile?.name || 'Candidate';
    const targetRole = profile?.profileInformation?.headline || stream.shortName;

    // Evaluate candidate response if user provided an answer
    let evaluation: TurnEvaluation | undefined;
    if (userMessage && userMessage.trim().length > 0) {
      const lengthScore = Math.min(100, Math.max(50, userMessage.trim().split(/\s+/).length * 4));
      const hasTechnicalKeywords = stream.recommendedSkills.some((s) =>
        userMessage.toLowerCase().includes(s.toLowerCase().split(' ')[0])
      );
      const depthScore = hasTechnicalKeywords ? Math.min(95, lengthScore + 15) : Math.max(65, lengthScore - 10);

      evaluation = {
        clarityScore: Math.round(lengthScore),
        technicalDepthScore: Math.round(depthScore),
        feedback: hasTechnicalKeywords
          ? 'Good incorporation of domain concepts and structural clarity.'
          : 'Answer was concise; consider providing concrete technical examples and trade-offs.',
      };
    }

    // Determine next phase (progresses sequentially from 1 to 8)
    let nextPhase: InterviewPhase = currentPhase;
    if (userMessage && userMessage.trim().length > 0) {
      nextPhase = Math.min(8, currentPhase + 1) as InterviewPhase;
    }

    const isConcluded = nextPhase === 8 && userMessage.trim().length > 0;
    const phaseName = INTERVIEW_PHASE_NAMES[nextPhase];

    // Check if an external AI API key is configured
    const apiKey = process.env.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const aiResponse = await this.callAIProvider(apiKey, {
          candidateName,
          targetRole,
          streamName: stream.name,
          skills: profile?.skills || stream.recommendedSkills.slice(0, 5),
          currentPhase: nextPhase,
          phaseName,
          userMessage,
          history,
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
   */
  private static generateContextualQuestion(params: {
    candidateName: string;
    targetRole: string;
    streamId: string;
    streamName: string;
    skills: string[];
    currentPhase: InterviewPhase;
    userMessage: string;
  }): string {
    const { candidateName, targetRole, streamId, currentPhase, skills, userMessage } = params;
    const primarySkill = skills[0] || 'software development';

    switch (currentPhase) {
      case 1:
        return `Hello ${candidateName}! Welcome to your technical mock interview for the ${targetRole} track. I am Dr. Elena Vance, your AI Technical Evaluator today. We'll be assessing your core foundation, architectural reasoning, and practical problem-solving. To start, could you briefly introduce yourself and share what motivated you to specialize in ${params.streamName}?`;

      case 2:
        return `Thank you for that introduction. Looking at your foundation with ${primarySkill}, could you describe a core principle or abstraction in your daily workflow that you consider critical for building resilient systems?`;

      case 3:
        if (streamId === 'ai_ml') {
          return `Let's dive into your machine learning projects. When training complex models or fine-tuning neural networks, what specific metrics (beyond raw accuracy) do you monitor to diagnose overfitting or data distribution drift?`;
        } else if (streamId === 'data_science') {
          return `Looking at your data analysis projects: When designing end-to-end data pipelines, how do you handle schema evolution and late-arriving records without corrupting downstream analytical dashboards?`;
        } else {
          return `Let's discuss your engineering projects. Walk me through a recent project you built using ${primarySkill}. Specifically, what was the most demanding architectural decision you had to make, and what alternatives did you reject?`;
        }

      case 4:
        // Technical Domain Core
        if (streamId === 'ai_ml') {
          return `Here is a technical concept question: In Transformer architectures, self-attention has an O(N^2) memory and compute complexity with sequence length N. What mathematical or architectural optimizations (like FlashAttention or Sparse Attention) address this bottleneck, and what are their trade-offs?`;
        } else if (streamId === 'data_science') {
          return `Technical fundamentals: Can you explain Simpson's Paradox? Describe a realistic scenario in product experimentation where an aggregated metric suggests one conclusion, but segmenting the data reveals the opposite effect.`;
        } else {
          return `Technical fundamentals: In high-scale data storage, what are the fundamental differences between B-Tree indexes (common in relational databases like PostgreSQL) and Log-Structured Merge (LSM) Trees (common in Cassandra or RocksDB)? When would you choose one over the other?`;
        }

      case 5:
        // Tricky / Intellectual Problem-Solving Scenario
        if (streamId === 'ai_ml') {
          return `Here is a tricky scenario: Suppose your Retrieval-Augmented Generation (RAG) pipeline frequently outputs hallucinated answers even though your vector database successfully retrieves the exact reference documents with high cosine similarity. How would you systematically debug this? Is it an embedding misalignment, chunking issue, context window compression problem, or LLM prompt instruction deficit?`;
        } else if (streamId === 'data_science') {
          return `Tricky experimentation challenge: You run an A/B test for a new checkout flow. The conversion rate shows a statistically significant increase of +3.5% (p = 0.01), but average order value and overall net revenue decreased by 5%. The growth team wants to ship the feature immediately based on the conversion win. How do you evaluate this tradeoff, and what would you recommend?`;
        } else {
          return `Here is a challenging scenario: Imagine your distributed service uses a cache-aside pattern with Redis. During a viral traffic event, a popular cache key expires, resulting in thousands of concurrent requests all hitting your primary relational database simultaneously (Cache Stampede / Thundering Herd), spiking CPU to 100%. How would you re-architect the caching layer to prevent this catastrophic failure?`;
        }

      case 6:
        // Adaptive Follow-up based on candidate's answer
        return `Interesting points you raised in your answer: "${userMessage.slice(0, 60)}...". Let's probe an edge case: How would your proposed approach hold up under network partitions (split-brain scenarios) or when scaling across multi-region datacenters with asynchronous replication lag?`;

      case 7:
        // Behavioral / Engineering Leadership
        return `Let's transition to engineering collaboration and leadership: Tell me about a time you had a strong technical disagreement with a colleague or lead regarding system architecture or technical debt. How did you advocate for your point of view, and what was the resolution?`;

      case 8:
      default:
        return `Thank you, ${candidateName}. You've demonstrated structured thinking and solid domain competence across our discussion. That concludes our interview questions today! Do you have any final thoughts or closing questions before we generate your comprehensive readiness report?`;
    }
  }

  /**
   * Calls an external AI Provider (Gemini / OpenAI compatible)
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
      history: Array<{ sender: 'ai' | 'candidate'; text: string }>;
    }
  ): Promise<string | null> {
    try {
      const prompt = `You are Dr. Elena Vance, a senior technical interviewer conducting a technical mock interview for a candidate named ${context.candidateName} targeting a ${context.targetRole} role in ${context.streamName}.
Candidate skills: ${context.skills.join(', ')}.
Current Phase: Phase ${context.currentPhase} (${context.phaseName}).
Candidate's latest response: "${context.userMessage}".

Instructions:
1. Briefly acknowledge their response (1-2 sentences) evaluating their point.
2. Ask exactly ONE thoughtful, intellectually challenging question for Phase ${context.currentPhase}.
3. Do NOT provide the answer.
4. Keep tone professional, encouraging, and rigorous.`;

      // Call Google Gemini endpoint if apiKey looks like Gemini or fallback to endpoint
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
