/**
 * Help Chatbot Service
 * Concise, supportive guidance about the AI Mock Interview Platform.
 */

export class HelpChatbotService {
  private static readonly SYSTEM_INSTRUCTION = `You are the Help Assistant for this AI Mock Interview Platform. Answer questions about how to use this application. Only provide information about features that actually exist in the application. Keep responses short, beginner-friendly, and concise (1-3 sentences).
Existing Application Details:
- 4 Stages: Stage 1 Resume Analysis (/stages/resume), Stage 2 Aptitude Assessment (/stages/aptitude, exactly 10 questions across 5 categories with review & explanations), Stage 3 Coding (/stages/coding, exactly 5 problems, blank editor, Run Code vs Submit Solution, supports Python/JS/TS/C++/Java), Stage 4 AI Mock Interview (/stages/interview, 8 phases with Dr. Elena Vance, supports Text & Voice modes, answers are analyzed, candidate can say "I don't know" or "I can't answer").
- Final Evaluation (/stages/evaluation): full report with overall score, stage breakdown, strengths, weaknesses, and recommendations.
- Dashboard (/dashboard): track pipeline progress and access unlocked stages.
- Profile (/profile): update candidate headline, skills, bio, and change Career Stream (Software Engineering, AI & Machine Learning, Data Science).
- Theme: click the Sun/Moon icon in the top navigation bar to toggle between Light and Dark mode.
- If you do not know the answer, respond with: "I'm not sure about that. Try asking me how to use the Resume, Aptitude, Coding, AI Interview, Results, Profile, or Settings sections."`;

  /**
   * Generates a helpful response for user queries
   */
  static async getHelpResponse(userMessage: string): Promise<string> {
    const trimmed = userMessage.trim().toLowerCase();

    // 1. High-precision direct pattern matches for instant, accurate answers
    const directResponse = this.matchDirectPattern(trimmed);
    if (directResponse) {
      return directResponse;
    }

    // 2. Check for configured AI Provider (Gemini / OpenAI)
    const apiKey = process.env.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${this.SYSTEM_INSTRUCTION}\n\nUser Question: "${userMessage}"\nHelp Assistant Answer:`,
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0.3, maxOutputTokens: 120 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) return reply;
        }
      } catch (err) {
        console.warn('Help Chatbot AI provider call failed, falling back to local responder:', err);
      }
    }

    // 3. Smart local keyword analysis fallback
    return this.generateSmartFallback(trimmed);
  }

  private static matchDirectPattern(query: string): string | null {
    // Start interview / general usage
    if (query.includes('how do i start') && (query.includes('interview') || query.includes('test') || query.includes('preparation'))) {
      return 'Go to your Dashboard or Stages menu, ensure your Career Stream is selected, and start with Stage 1: Resume Analysis. Stages unlock sequentially as you complete them!';
    }
    if (query.includes('how do i use') || query.includes('how to use') || query.includes('getting started')) {
      return 'Follow the 4 sequential stages: 1. Resume Analysis, 2. Aptitude Assessment, 3. Coding Round, and 4. AI Mock Interview. After finishing, view your comprehensive evaluation report!';
    }

    // Resume Analysis
    if (query.includes('resume')) {
      return 'Stage 1: Resume Analysis evaluates your uploaded PDF/DOCX or text resume against your selected career stream to generate an ATS compatibility score, identify key skills, and suggest improvements.';
    }

    // Aptitude Test
    if (query.includes('how many aptitude questions') || query.includes('number of aptitude questions') || (query.includes('aptitude') && query.includes('how many'))) {
      return 'The aptitude assessment contains exactly 10 questions per attempt, covering Logical Reasoning, Quantitative Aptitude, Verbal Reasoning, Technical Aptitude, and Problem Solving.';
    }
    if (query.includes('aptitude')) {
      return 'The Aptitude Assessment gives you 10 questions with single-question navigation and a 20-minute timer. After submitting, you can review all 10 questions with detailed explanations.';
    }

    // Coding Test
    if (query.includes('how do i run my code') || query.includes('how to run code') || query.includes('run code') || query.includes('run my code')) {
      return 'In Stage 3 (Coding), write your algorithm in the code editor and click the "Run Code" button. The output panel at the bottom will display test case results, runtime, and console output.';
    }
    if (query.includes('coding') || query.includes('code test') || query.includes('problem solving')) {
      return 'The Coding stage features 5 problems. The editor is blank so you can code your own solution. Use "Run Code" to test sample cases and "Submit Problem" to evaluate all test cases.';
    }

    // AI Mock Interview & Voice
    if (query.includes('voice')) {
      return 'In Stage 4: AI Mock Interview, switch to "Voice Mode" in the top bar. Click the microphone icon to speak your response; your speech will automatically transcribe and Dr. Elena Vance will speak back to you.';
    }
    if (query.includes('mock interview') || query.includes('interview stage') || query.includes('elena')) {
      return 'The AI Mock Interview is an 8-phase technical interview led by Dr. Elena Vance. She evaluates your domain knowledge, architectural reasoning, and communication in real time.';
    }
    if (query.includes("don't know") || query.includes('cannot answer') || query.includes("can't answer") || query.includes('not know an answer')) {
      return 'If you do not know an answer in the mock interview, simply say "I don\'t know" or "I can\'t answer". The AI will acknowledge it professionally and move to the next question without terminating your session.';
    }

    // Results / Evaluation
    if (query.includes('see my results') || query.includes('view results') || query.includes('report') || query.includes('evaluation')) {
      return 'Once you complete the 4 preparation stages, click "End & Evaluate" or navigate to the Evaluation page to view your complete readiness report with strengths and recommendations.';
    }
    if (query.includes('previous') || query.includes('history') || query.includes('past attempts')) {
      return 'Both the Aptitude and Coding pages have a "History" button in the top bar where you can view your past attempts, scores, and review previous questions.';
    }

    // Profile & Stream
    if (query.includes('career stream') || query.includes('change stream') || query.includes('track')) {
      return 'To change your career stream, go to your Profile page and select one of the tracks: Software Engineering, AI & Machine Learning, or Data Science.';
    }
    if (query.includes('profile')) {
      return 'Visit the Profile page from the top navbar to update your headline, bio, core technical skills, and target career stream.';
    }

    // Theme / Dark Mode
    if (query.includes('dark mode') || query.includes('light mode') || query.includes('theme')) {
      return 'You can toggle between Light Mode and Dark Mode at any time by clicking the Sun / Moon icon in the top right corner of the navigation bar.';
    }

    return null;
  }

  private static generateSmartFallback(query: string): string {
    if (query.includes('help') || query.includes('what can you do') || query.includes('who are you')) {
      return 'I\'m your SkillLab Help Assistant! Ask me how to use Resume Analysis, Aptitude, Coding, AI Mock Interview, change themes, or manage your profile.';
    }

    return "I'm not sure about that. Try asking me how to use the Resume, Aptitude, Coding, AI Interview, Results, Profile, or Settings sections.";
  }
}
