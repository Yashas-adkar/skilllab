import {
  AnswerStatus,
  TurnEvaluation,
  InterviewPhase,
} from '@/types/interview-chat.types';
import { getStreamById, getDefaultStream } from '@/config/streams';
import { UserProfile } from '@/types/auth.types';

export interface AnswerAnalysisResult {
  evaluation: TurnEvaluation;
  interviewerAcknowledgement: string;
  shouldConcludeEarly: boolean;
  weaknessDetected?: string;
  strengthDetected?: string;
  topic: string;
}

export interface AnalyzeAnswerParams {
  question: string;
  answer: string;
  streamId: string;
  phase: InterviewPhase;
  profile?: UserProfile | null;
  unansweredCountSoFar: number;
  maxUnansweredThreshold?: number; // default 3
}

export class InterviewAnalyzerService {
  private static readonly INABILITY_PATTERNS = [
    /\b(i\s*can'?t\s*answer|cannot\s*answer|can\s*not\s*answer)\b/i,
    /\b(i\s*don'?t\s*know|don'?t\s*know\s*the\s*answer|do\s*not\s*know)\b/i,
    /\b(i'?m\s*not\s*sure|am\s*not\s*sure|not\s*certain)\b/i,
    /\b(i\s*have\s*no\s*idea|no\s*idea|no\s*clue|zero\s*idea)\b/i,
    /\b(i\s*don'?t\s*have\s*an\s*answer|no\s*answer)\b/i,
    /\b(skip\s*this|pass|pass\s*on\s*this|next\s*question\s*please)\b/i,
    /\b(i\s*am\s*unable\s*to\s*answer|unable\s*to\s*answer)\b/i,
    /\b(haven'?t\s*learned\s*this|never\s*heard\s*of\s*this)\b/i,
    /\b(i'?m\s*not\s*familiar\s*with\s*this)\b/i,
  ];

  /**
   * Evaluates an individual candidate answer thoroughly before producing interviewer reply
   */
  static analyzeAnswer(params: {
    question: string;
    answer: string;
    streamId: string;
    phase: InterviewPhase;
    profile?: UserProfile | null;
    unansweredCountSoFar: number;
    maxUnansweredThreshold?: number;
  }): AnswerAnalysisResult {
    const {
      question,
      answer,
      streamId,
      phase,
      unansweredCountSoFar,
      maxUnansweredThreshold = 3,
    } = params;

    const stream = getStreamById(streamId) || getDefaultStream();
    const cleanAnswer = answer.trim();
    const lowerAnswer = cleanAnswer.toLowerCase();

    // 1. Check for explicit inability to answer
    const isExplicitInability = this.INABILITY_PATTERNS.some((pattern) =>
      pattern.test(lowerAnswer)
    );

    if (isExplicitInability || cleanAnswer.length === 0) {
      const newUnansweredCount = unansweredCountSoFar + 1;
      const shouldConcludeEarly = newUnansweredCount >= maxUnansweredThreshold;

      let acknowledgement = 'I understand. Let\'s move forward to the next question.';
      if (shouldConcludeEarly) {
        acknowledgement =
          'I note that you were unable to answer multiple consecutive technical questions. In accordance with interview standards, we will adjust our assessment and proceed to closing.';
      } else if (newUnansweredCount === 2) {
        acknowledgement =
          'Understood. That is noted for this topic. Let\'s transition to a different technical area where you can demonstrate your strengths.';
      } else {
        if (phase === 1) {
          acknowledgement = 'No problem at all. We will proceed directly to our technical foundation discussion.';
        } else {
          acknowledgement = 'I understand. Let\'s move to our next question.';
        }
      }

      return {
        evaluation: {
          answerStatus: 'unanswered',
          relevanceScore: 10,
          correctnessScore: 0,
          technicalScore: 0,
          communicationScore: 50,
          clarityScore: 60,
          technicalDepthScore: 10,
          feedback:
            'Candidate explicitly stated inability to answer. Demonstrating familiarity with foundational technical principles is recommended.',
          followUpRequired: false,
          detectedIntent: 'explicit_inability_to_answer',
        },
        interviewerAcknowledgement: acknowledgement,
        shouldConcludeEarly,
        weaknessDetected: `Unanswered technical domain question in Phase ${phase}`,
        topic: `Phase ${phase}`,
      };
    }

    // 2. Check for Off-Topic / Irrelevant Response
    // If the answer does not mention any technical domain concepts or is completely out of domain
    const questionWords = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const answerWords = lowerAnswer
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const commonWithQuestion = questionWords.filter((w) => lowerAnswer.includes(w));
    const technicalKeywords = [
      ...stream.recommendedSkills.map((s) => s.toLowerCase()),
      'architecture',
      'system',
      'algorithm',
      'database',
      'data',
      'model',
      'performance',
      'latency',
      'distributed',
      'concurrency',
      'optimization',
      'design',
      'service',
      'pipeline',
      'tradeoff',
      'code',
      'test',
      'scalability',
      'cache',
      'index',
      'query',
      'network',
      'engineering',
      'project',
      'experience',
      'developed',
      'implemented',
    ];

    const matchedTechTerms = technicalKeywords.filter((k) => lowerAnswer.includes(k));

    const isPhase1Introduction = phase === 1;
    const isVeryShort = answerWords.length < 5;

    // Determine relevance
    let isIrrelevant = false;
    if (!isPhase1Introduction && isVeryShort && matchedTechTerms.length === 0 && commonWithQuestion.length === 0) {
      isIrrelevant = true;
    }

    // If answer contains obviously off-topic chatter (e.g. food, weather, random unrelated text)
    const offTopicNoise = ['weather', 'pizza', 'burger', 'movie', 'football', 'cricket', 'recipe', 'cooking'];
    if (offTopicNoise.some((w) => lowerAnswer.includes(w)) && matchedTechTerms.length === 0) {
      isIrrelevant = true;
    }

    if (isIrrelevant) {
      return {
        evaluation: {
          answerStatus: 'irrelevant',
          relevanceScore: 20,
          correctnessScore: 10,
          technicalScore: 15,
          communicationScore: 40,
          clarityScore: 45,
          technicalDepthScore: 10,
          feedback:
            'The response does not appear directly relevant to the question asked. Ensure your answers address the specific technical prompt.',
          followUpRequired: true,
          detectedIntent: 'off_topic_response',
        },
        interviewerAcknowledgement:
          'It seems your response did not directly address the question. Let\'s refocus on the key technical requirement.',
        shouldConcludeEarly: false,
        weaknessDetected: 'Irrelevant or evasive answer provided',
        topic: `Phase ${phase}`,
      };
    }

    // 3. Technical Correctness & Depth Assessment
    const lengthFactor = Math.min(100, Math.max(40, answerWords.length * 3));
    const termCount = matchedTechTerms.length;

    let correctnessScore = 70;
    let technicalScore = 65;
    let communicationScore = 75;
    let answerStatus: AnswerStatus = 'partially_correct';
    let acknowledgement = '';
    let followUpRequired = false;

    if ((termCount >= 2 && answerWords.length >= 15) || (termCount >= 3 && answerWords.length >= 12)) {
      // Strong, complete, technically sound answer
      answerStatus = 'answered_correctly';
      correctnessScore = Math.min(98, 80 + termCount * 4);
      technicalScore = Math.min(95, 75 + termCount * 4);
      communicationScore = Math.min(95, lengthFactor);
      acknowledgement = this.getStrongAnswerAcknowledgement(phase, cleanAnswer);
    } else if (termCount >= 1 && answerWords.length >= 6) {
      // Partially correct / foundational answer
      answerStatus = 'partially_correct';
      correctnessScore = Math.min(78, 60 + termCount * 5);
      technicalScore = Math.min(75, 55 + termCount * 5);
      communicationScore = Math.min(80, lengthFactor);
      followUpRequired = true;
      acknowledgement = this.getPartialAnswerAcknowledgement(cleanAnswer);
    } else {
      // Superficial or incorrect
      answerStatus = 'incorrect';
      correctnessScore = 40;
      technicalScore = 35;
      communicationScore = 55;
      acknowledgement =
        'That captures only a small part of the picture, and in practice this would encounter significant edge cases. Let\'s evaluate another angle.';
    }

    const clarityScore = Math.round(communicationScore);
    const technicalDepthScore = Math.round(technicalScore);

    return {
      evaluation: {
        answerStatus,
        relevanceScore: answerStatus === 'answered_correctly' ? 95 : answerStatus === 'partially_correct' ? 80 : 50,
        correctnessScore,
        technicalScore,
        communicationScore,
        clarityScore,
        technicalDepthScore,
        feedback:
          answerStatus === 'answered_correctly'
            ? 'Strong technical explanation with clear reasoning and domain terminology.'
            : answerStatus === 'partially_correct'
            ? 'Good foundational understanding; consider discussing deeper tradeoffs, scale implications, and concrete failure modes.'
            : 'Answer was overly brief or missed key architectural constraints. Elaborate with specific technical mechanisms.',
        followUpRequired,
        detectedIntent: 'substantive_answer',
      },
      interviewerAcknowledgement: acknowledgement,
      shouldConcludeEarly: false,
      strengthDetected:
        answerStatus === 'answered_correctly'
          ? `Solid command of domain concepts in Phase ${phase}`
          : undefined,
      weaknessDetected:
        answerStatus === 'incorrect'
          ? `Superficial or incomplete explanation in Phase ${phase}`
          : undefined,
      topic: `Phase ${phase}`,
    };
  }

  private static getStrongAnswerAcknowledgement(phase: InterviewPhase, answer: string): string {
    if (phase === 1) {
      return 'Thank you for sharing your background and path. It provides helpful context as we begin our technical discussion.';
    }
    const snippets = [
      'Excellent explanation. You clearly articulated the underlying mechanisms and engineering tradeoffs.',
      'Spot on. That demonstrates solid real-world experience and architectural clarity.',
      'Very well structured answer. You highlighted the critical performance and scalability considerations effectively.',
      'Good technical depth. You addressed the core abstraction with precision.',
    ];
    return snippets[phase % snippets.length];
  }

  private static getPartialAnswerAcknowledgement(answer: string): string {
    return 'You have captured the baseline concept well. In high-scale production systems, there are additional tradeoffs and edge cases to consider.';
  }
}
