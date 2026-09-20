/**
 * AI Help Chatbot Service
 * Intelligent assistant understanding the entire AI Mock Interview Platform,
 * its pages, form fields, stages, workflow, settings, and terminology.
 */

export interface ChatHistoryItem {
  sender: 'bot' | 'user';
  text: string;
}

export interface HelpChatRequest {
  message: string;
  pathname?: string;
  history?: ChatHistoryItem[];
}

export class HelpChatbotService {
  private static readonly SYSTEM_INSTRUCTION = `You are the AI Help Assistant for the AI Mock Interview Platform (SkillLab).
Your job is to help users understand and use the entire application.
You have comprehensive knowledge of the application's actual pages, fields, features, interview workflow, settings, and functionality.

Rules:
1. Answer natural-language questions clearly, concisely, and helpfully (1-3 sentences).
2. If a user asks what they should enter into a field (e.g. Academic Background, Technical Skills, Bio, Projects, Experience), explain what the field is for and provide concrete, realistic examples.
3. If a user asks how to perform an action, provide exact steps using the actual application's navigation and controls.
4. If a user asks a follow-up question (e.g. "Where do I enter that?", "Can you give me an example?", "Is this required?"), use the conversation history and current page to understand what they are referring to.
5. NEVER invent features that do not exist in the application (for example: video resumes, human interviewers, live proctoring, and job application boards do NOT exist).
6. If asked about something the platform doesn't support, politely state that the current application does not support it and mention what is supported instead.

Application Structure & Knowledge:
- Navigation:
  * Top Navbar: Logo, Stages dropdown, Dashboard, Profile, Theme Toggle (Sun/Moon icon for Light/Dark mode), and Login/Logout.
- Profile Page (/profile):
  * Section 1: Career Stream Selection (Required: 'cs_se' Software Engineering, 'ai_ml' AI & Machine Learning, 'data_science' Data Science).
  * Section 2: Candidate Info (Full Name, Registered Email [read-only], Target Job Role / Headline e.g. "Backend Engineer", and Brief Bio / Interview Objective).
  * Section 3: Technical Skills & Keywords (Pill toggles for recommended stream skills + 'Add Custom Skill' input where pressing Enter adds skills like Python, Java, React, SQL, Docker).
  * Section 4: Academic Background (Degree / Specialization e.g. "B.Tech Computer Science", College / University e.g. "XYZ Institute of Technology", Graduation Year e.g. "2025").
- 4 Sequential Preparation Stages:
  * Stage 1: Resume Analysis (/stages/resume): Upload PDF, DOCX, or text file. Evaluates ATS match, keyword density, and technical competencies for your stream. Passing score: 60%.
  * Stage 2: Aptitude Assessment (/stages/aptitude): Exactly 10 questions per attempt across 5 categories (Logical Reasoning, Quantitative Aptitude, Verbal Reasoning, Technical Aptitude, Problem Solving). 20-minute timer. Answers and explanations are hidden during test. Post-submission review mode shows all 10 questions with user answers, correct answers, and educational explanations. Past attempts saved in History.
  * Stage 3: Coding & Problem Solving (/stages/coding): Exactly 5 problems per assessment (P1 to P5). Blank code editor (no pre-filled solutions). Minimal function templates for Python, JavaScript, TypeScript, C++, and Java. 'Run Code' runs against sample visible test cases; 'Submit Problem' evaluates against full test suite (including hidden test cases). Output panel at bottom displays test case results, runtime, memory, console logs, compilation errors, and tracebacks. Code is preserved per problem. History tab stores past attempts.
  * Stage 4: AI Mock Interview (/stages/interview): 8 progressive phases with Dr. Elena Vance. Supports Text Mode and Voice Mode (speech-to-text via microphone button + audio voice response via text-to-speech). Deep answer analysis evaluates relevance, correctness, and communication. If a candidate says "I don't know" or "I can't answer", Dr. Vance acknowledges it professionally, logs the weakness, and continues without abrupt termination.
- Evaluation Report (/stages/evaluation):
  * Generated after completing the pipeline. Shows overall score, individual stage scores, strengths, weaknesses, and targeted recommendations.
- Dashboard (/dashboard):
  * Displays overall progress, status of all 4 stages (Locked, Ready to Start, In Progress, Passed, Needs Improvement), and quick review links.`;

  /**
  /**
   * Generates an intelligent, context-aware help response
   */
  static async getHelpResponse(request: HelpChatRequest | string): Promise<string> {
    const reqObj: HelpChatRequest = typeof request === 'string' ? { message: request } : request;
    const { message = '', pathname = '', history = [] } = reqObj;
    const cleanMessage = (message || '').trim();

    if (!cleanMessage) {
      return 'Please ask a question about how to use the platform.';
    }

    // 1. Try Live AI Provider (Gemini / OpenAI) if configured
    const apiKey = process.env.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const historyText = history
          .slice(-6)
          .map((h) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
          .join('\n');

        const prompt = `${this.SYSTEM_INSTRUCTION}

Current User Page: ${pathname || 'General Navigation'}
Recent Conversation:
${historyText ? historyText : '(No prior conversation)'}

User: "${cleanMessage}"
Assistant:`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 160 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) return reply;
        }
      } catch (err) {
        console.warn('Live AI Help Provider call failed, falling back to local engine:', err);
      }
    }

    // 2. Comprehensive Local Natural Language Resolution Engine
    return this.resolveLocally(cleanMessage, pathname, history);
  }

  /**
   * Local context-aware resolution engine handling natural language questions about all fields,
   * stages, features, workflows, and conversational follow-ups.
   */
  private static resolveLocally(message: string, pathname: string, history: ChatHistoryItem[]): string {
    const q = message.toLowerCase().trim();
    const lastUserMsg = [...history].reverse().find((h) => h.sender === 'user')?.text.toLowerCase() || '';
    const lastBotMsg = [...history].reverse().find((h) => h.sender === 'bot')?.text.toLowerCase() || '';

    // ================= CONTEXTUAL FOLLOW-UPS =================
    // If user asks "Where do I enter that?", "Where do I add this?", "Where is it?"
    if (
      q.includes('where do i enter') ||
      q.includes('where do i add') ||
      q.includes('where is it') ||
      q.includes('where do i put') ||
      q.includes('where is this')
    ) {
      if (lastUserMsg.includes('skill') || lastBotMsg.includes('skill')) {
        return 'You can enter technical skills in Section 3 of your Profile page (/profile). Type each skill into the "Add Custom Skill" field and press Enter, or click the recommended skill tags.';
      }
      if (lastUserMsg.includes('academic') || lastUserMsg.includes('degree') || lastBotMsg.includes('academic') || lastBotMsg.includes('degree')) {
        return 'You can enter your educational details in Section 4 (Academic Background) on your Profile page (/profile), which includes Degree, College/University, and Graduation Year.';
      }
      if (lastUserMsg.includes('project') || lastUserMsg.includes('experience') || lastBotMsg.includes('project')) {
        return 'You can summarize your key projects and experience in the "Brief Bio" field on your Profile page, and detail them thoroughly in your uploaded resume during Stage 1: Resume Analysis.';
      }
      if (lastUserMsg.includes('stream') || lastBotMsg.includes('stream')) {
        return 'You can select or change your Career Stream in Section 1 of your Profile page (/profile).';
      }
      return 'You can enter and manage your information on your Profile page (/profile), accessible via the top navigation bar.';
    }

    // If user asks "Can you give me an example?" or "Give me an example"
    if (q.includes('give me an example') || q.includes('for example') || q.includes('can you give an example')) {
      if (lastUserMsg.includes('skill') || lastBotMsg.includes('skill')) {
        return 'For a Software Engineering profile: Python, Java, TypeScript, React, PostgreSQL, Docker, Git, and REST APIs. Only list technologies you are ready to discuss!';
      }
      if (lastUserMsg.includes('academic') || lastUserMsg.includes('degree') || lastBotMsg.includes('academic') || lastBotMsg.includes('degree')) {
        return 'For Academic Background: Degree: "B.Tech in Computer Science", College/University: "National Institute of Technology", and Graduation Year: "2025".';
      }
      if (lastUserMsg.includes('headline') || lastBotMsg.includes('headline') || lastUserMsg.includes('role')) {
        return 'For Target Job Role / Headline: "Full-Stack Developer", "Backend Engineer (Node/Python)", or "Machine Learning Systems Engineer".';
      }
      if (lastUserMsg.includes('bio') || lastBotMsg.includes('bio')) {
        return 'Bio example: "CS senior specializing in distributed backend systems. Built scalable microservices using Go and PostgreSQL, with a passion for high-concurrency architecture."';
      }
      if (lastUserMsg.includes('project') || lastBotMsg.includes('project')) {
        return 'Project example: "Distributed Task Queue: Built an asynchronous job worker using Redis and Node.js that processed 10k tasks/sec, reducing API response times by 35%."';
      }
      return 'For example, if you are targeting Software Engineering, you can set your headline to "Backend Engineer" and list skills like Java, Python, SQL, and Docker.';
    }

    // If user asks "Is this required?" or "Do I have to fill this?"
    if (q.includes('is this required') || q.includes('is it mandatory') || q.includes('do i have to fill') || q.includes('required')) {
      if (q.includes('stream') || lastUserMsg.includes('stream') || lastBotMsg.includes('stream')) {
        return 'Yes, selecting a Career Stream on your Profile page is required because it calibrates the technical rubrics, aptitude questions, coding problems, and mock interview prompts.';
      }
      if (q.includes('resume') || lastUserMsg.includes('resume') || lastBotMsg.includes('resume')) {
        return 'Yes, Stage 1 (Resume Analysis) is the required entry point to the 4-stage pipeline, unlocking the subsequent Aptitude and Coding rounds.';
      }
      return 'Selecting a Career Stream and filling your basic Profile is required to unlock and personalize your interview preparation stages.';
    }

    // If user asks "Can I change it later?" or "Can I edit this?"
    if (q.includes('can i change') || q.includes('change it later') || q.includes('edit later')) {
      return 'Yes! You can update your career stream, skills, bio, and academic background at any time by visiting your Profile page (/profile).';
    }

    // If user asks "What should I write here?" using page context
    if (q.includes('what should i write here') || q.includes('what should i enter here') || q.includes('what is this page')) {
      if (pathname.includes('/profile')) {
        return 'On the Profile page, choose your Career Stream (Section 1), enter your name, headline, and bio (Section 2), add your technical skills (Section 3), and fill in your degree, college, and graduation year (Section 4).';
      }
      if (pathname.includes('/stages/resume')) {
        return 'Upload your PDF, DOCX, or text resume here. The AI will evaluate ATS alignment, keyword density, and technical competencies for your chosen career stream.';
      }
      if (pathname.includes('/stages/aptitude')) {
        return 'Here you answer 10 aptitude questions across Logical, Quantitative, Verbal, Technical, and Problem Solving categories within 20 minutes.';
      }
      if (pathname.includes('/stages/coding')) {
        return 'Here you solve 5 coding problems. The editor is blank so you can write your own solution. Use "Run Code" to test sample cases and "Submit Problem" to run all test cases.';
      }
      if (pathname.includes('/stages/interview')) {
        return 'Here you participate in an 8-phase technical mock interview with Dr. Elena Vance. You can respond by typing or using voice mode.';
      }
      if (pathname.includes('/stages/evaluation')) {
        return 'This page presents your comprehensive interview readiness report with overall and stage scores, strengths, weaknesses, and recommendations.';
      }
      return 'This platform prepares you for tech interviews through 4 stages: Resume Analysis, Aptitude Testing, Coding, and an AI Mock Interview.';
    }

    // ================= SECTION 1: PROFILE FIELDS =================
    // Academic Background / Education
    if (
      q.includes('academic background') ||
      q.includes('academic') ||
      q.includes('education') ||
      q.includes('degree') ||
      q.includes('college') ||
      q.includes('university') ||
      q.includes('graduation year')
    ) {
      return 'In the Academic Background section (/profile), enter your Degree / Specialization (e.g., "B.Tech Computer Science"), your College / University (e.g., "National Institute of Technology"), and your Graduation Year (e.g., "2025"). This helps the AI calibrate interview questions to your academic level.';
    }

    // Technical Skills
    if (
      q.includes('technical skills') ||
      q.includes('technical skill') ||
      q.includes('skills') ||
      q.includes('add skills') ||
      q.includes('what skills') ||
      q.includes('programming languages') ||
      q.includes('python as a skill') ||
      q.includes('can i add')
    ) {
      if (q.includes('python') || q.includes('java') || q.includes('c++') || q.includes('javascript') || q.includes('sql')) {
        return 'Yes! You can add languages like Python, Java, C++, JavaScript, and SQL. On your Profile page (/profile), click the recommended skill tags or type them into the "Add Custom Skill" field and press Enter.';
      }
      return 'In the Technical Skills section (/profile), enter the programming languages (Python, Java, C++), frameworks (React, Django), databases (SQL, MongoDB), and developer tools (Git, Docker) that you know. For example: Java, Python, SQL, Git, and HTML/CSS. Only list technologies you are comfortable discussing in an interview.';
    }

    // Projects
    if (q.includes('project') || q.includes('projects')) {
      return 'In your profile bio and on your resume, highlight 2-3 substantial technical projects. Mention the problem solved, tech stack used, system architecture, and quantifiable outcomes (for example: "Engineered a Redis cache-aside layer that lowered endpoint latency by 40%").';
    }

    // Experience / No work experience
    if (
      q.includes('experience') ||
      q.includes('no work experience') ||
      q.includes("don't have work experience") ||
      q.includes('fresher') ||
      q.includes('no experience')
    ) {
      return 'If you do not have formal work experience, that is completely fine! You can highlight academic capstone projects, technical internships, hackathon participation, open-source contributions, or personal coding projects in your bio and resume.';
    }

    // Bio / Headline / Candidate Info
    if (q.includes('headline') || q.includes('bio') || q.includes('objective') || q.includes('candidate info')) {
      return 'In Section 2 of your Profile, set your Target Job Role (e.g., "Full-Stack Engineer" or "Junior Data Scientist") and a 2-3 sentence Bio describing your tech stack, key projects, and what kind of roles you are targeting.';
    }

    // ================= SPECIFIC MULTI-CONCEPT CHECKS =================
    // Difference between aptitude and coding
    if (
      q.includes('difference between the aptitude and coding') ||
      q.includes('difference between aptitude and coding') ||
      (q.includes('difference') && (q.includes('aptitude') || q.includes('coding')))
    ) {
      return 'The Aptitude stage tests your analytical, quantitative, verbal, and technical problem-solving through 10 multiple-choice questions. The Coding stage tests your hands-on programming and algorithms through 5 interactive coding problems in an IDE.';
    }

    // What happens after aptitude test
    if (
      q.includes('what happens after the aptitude') ||
      q.includes('after the aptitude test') ||
      q.includes('after aptitude')
    ) {
      return 'After submitting the Aptitude test with a passing score (60%), Stage 3: Coding & Problem Solving is unlocked on your Dashboard, where you can solve 5 coding problems in the IDE.';
    }

    // How to start an interview / stages
    if (
      q.includes('how do i start') ||
      q.includes('how to start') ||
      q.includes('how do i begin') ||
      q.includes('start an interview') ||
      q.includes('start my interview') ||
      q.includes('start interview')
    ) {
      return 'To start, navigate to your Dashboard (/dashboard) or the Stages dropdown. Begin with Stage 1: Resume Analysis. Once you complete each stage with a passing score (60%), the next stage unlocks sequentially.';
    }

    // Theme / Dark Mode
    if (q.includes('dark mode') || q.includes('light mode') || q.includes('theme')) {
      return 'You can switch between Light Mode and Dark Mode anytime by clicking the Sun / Moon toggle icon in the top right corner of the navigation bar.';
    }

    // Unsupported features (No hallucinations)
    if (q.includes('video resume') || q.includes('record video') || q.includes('camera') || q.includes('webcam')) {
      return 'No, the platform does not support video resumes. You can upload standard PDF, DOCX, or text files for Stage 1: Resume Analysis, and use microphone voice or text for Stage 4: AI Mock Interview.';
    }
    if (q.includes('human interviewer') || q.includes('real person') || q.includes('live proctor')) {
      return 'All mock interviews on SkillLab are conducted by our autonomous AI Technical Evaluator, Dr. Elena Vance, providing instant objective evaluation without needing a human interviewer.';
    }

    // ================= SECTION 1: PROFILE FIELDS =================
    // Academic Background / Education
    if (
      q.includes('academic background') ||
      q.includes('academic') ||
      q.includes('education') ||
      q.includes('degree') ||
      q.includes('college') ||
      q.includes('university') ||
      q.includes('graduation year')
    ) {
      return 'In the Academic Background section (/profile), enter your Degree / Specialization (e.g., "B.Tech Computer Science"), your College / University (e.g., "National Institute of Technology"), and your Graduation Year (e.g., "2025"). This helps the AI calibrate interview questions to your academic level.';
    }

    // Technical Skills
    if (
      q.includes('technical skills') ||
      q.includes('technical skill') ||
      q.includes('skills') ||
      q.includes('add skills') ||
      q.includes('what skills') ||
      q.includes('programming languages') ||
      q.includes('python as a skill') ||
      q.includes('can i add')
    ) {
      if (q.includes('python') || q.includes('java') || q.includes('c++') || q.includes('javascript') || q.includes('sql')) {
        return 'Yes! You can add languages like Python, Java, C++, JavaScript, and SQL. On your Profile page (/profile), click the recommended skill tags or type them into the "Add Custom Skill" field and press Enter.';
      }
      return 'In the Technical Skills section (/profile), enter the programming languages (Python, Java, C++), frameworks (React, Django), databases (SQL, MongoDB), and developer tools (Git, Docker) that you know. For example: Java, Python, SQL, Git, and HTML/CSS. Only list technologies you are comfortable discussing in an interview.';
    }

    // Projects
    if (q.includes('project') || q.includes('projects')) {
      return 'In your profile bio and on your resume, highlight 2-3 substantial technical projects. Mention the problem solved, tech stack used, system architecture, and quantifiable outcomes (for example: "Engineered a Redis cache-aside layer that lowered endpoint latency by 40%").';
    }

    // Experience / No work experience
    if (
      q.includes('experience') ||
      q.includes('no work experience') ||
      q.includes("don't have work experience") ||
      q.includes('fresher') ||
      q.includes('no experience')
    ) {
      return 'If you do not have formal work experience, that is completely fine! You can highlight academic capstone projects, technical internships, hackathon participation, open-source contributions, or personal coding projects in your bio and resume.';
    }

    // Bio / Headline / Candidate Info
    if (q.includes('headline') || q.includes('bio') || q.includes('objective') || q.includes('candidate info')) {
      return 'In Section 2 of your Profile, set your Target Job Role (e.g., "Full-Stack Engineer" or "Junior Data Scientist") and a 2-3 sentence Bio describing your tech stack, key projects, and what kind of roles you are targeting.';
    }

    // Career Stream
    if (q.includes('career stream') || q.includes('stream') || q.includes('track') || q.includes('change stream')) {
      return 'The platform offers 3 Career Streams: 1) Computer Science & Software Engineering, 2) AI & Machine Learning Engineering, and 3) Data Science & Advanced Analytics. You can change your stream anytime in Section 1 of your Profile (/profile).';
    }

    // Profile in general
    if (q.includes('profile')) {
      return 'Your Profile (/profile) lets you set your Career Stream, headline, bio, technical skills, and academic background (degree, college, graduation year). Keeping it updated personalizes all 4 interview stages.';
    }

    // ================= SECTION 2: RESUME ANALYSIS =================
    if (q.includes('resume')) {
      if (q.includes('why') || q.includes('need to upload')) {
        return 'Uploading your resume allows the AI to evaluate your ATS compatibility score, detect strengths and keyword gaps, and tailor mock interview questions to your actual project experiences.';
      }
      return 'Stage 1: Resume Analysis (/stages/resume) scans your uploaded PDF, DOCX, or text resume against your chosen career stream to generate an ATS alignment score, highlight core competencies, and suggest improvements. A score of 60% unlocks Stage 2.';
    }

    // ================= SECTION 3: APTITUDE ASSESSMENT =================
    if (
      q.includes('aptitude') ||
      q.includes('how many questions') ||
      q.includes('review my answers') ||
      q.includes('review answers') ||
      q.includes('explanations') ||
      q.includes('get explanations')
    ) {
      if (q.includes('review') || q.includes('explanation')) {
        return 'Yes! After submitting your test, you can review all 10 questions to see your selected answer, the correct answer, your score, and a comprehensive educational explanation for each question.';
      }
      if (q.includes('how many') || q.includes('number of questions')) {
        return 'The Aptitude Assessment contains exactly 10 questions per attempt, distributed across Logical Reasoning, Quantitative Aptitude, Verbal Reasoning, Technical Aptitude, and Problem Solving.';
      }
      return 'The Aptitude Assessment (/stages/aptitude) gives you 10 questions with single-question navigation and a 20-minute countdown timer. Answers and explanations are revealed in a full review section after submission.';
    }

    // ================= SECTION 4: CODING & PROBLEM SOLVING =================
    if (
      q.includes('coding') ||
      q.includes('code') ||
      q.includes('problem solving') ||
      q.includes('run my code') ||
      q.includes('see the output') ||
      q.includes('output') ||
      q.includes('problems')
    ) {
      if (q.includes('how many') || q.includes('number of problems')) {
        return 'The Coding stage features exactly 5 problems (P1 to P5) with graded difficulty across topics like Arrays, Strings, Binary Search, Dynamic Programming, and Stacks.';
      }
      if (q.includes('run my code') || q.includes('how do i run') || q.includes('run code')) {
        return 'Write your solution in the code editor and click the "Run Code" button. The output panel at the bottom will display test case results, runtime in milliseconds, and console logs.';
      }
      if (q.includes('output') || q.includes('where can i see the output')) {
        return 'The Output Panel is located directly below the code editor. It contains tabs for "Test Case Results" (showing passed/failed inputs and outputs) and "Console Output".';
      }
      if (q.includes('error') || q.includes('compilation error') || q.includes('runtime error')) {
        return 'If your code has an error, the Output Panel will display a red badge with the exact compilation error, syntax issue, or runtime traceback and line number so you can debug and re-run.';
      }
      if (q.includes('difference between run and submit') || (q.includes('run') && q.includes('submit'))) {
        return '"Run Code" tests your code against visible sample test cases for debugging. "Submit Problem" evaluates your solution against the full test suite, including hidden edge cases.';
      }
      if (q.includes('blank') || q.includes('pre-filled') || q.includes('solution')) {
        return 'The code editor is intentionally blank (providing only a minimal function signature) so you can solve the problem yourself. Supported languages include Python, JavaScript, TypeScript, C++, and Java.';
      }
      return 'Stage 3: Coding (/stages/coding) includes 5 problems with a blank editor. Use "Run Code" to test sample cases, "Submit Problem" to evaluate against hidden cases, and navigate with the P1–P5 tabs without losing your code.';
    }

    // ================= SECTION 5: AI MOCK INTERVIEW =================
    if (
      q.includes('interview') ||
      q.includes('elena') ||
      q.includes('voice') ||
      q.includes('microphone') ||
      q.includes("don't know") ||
      q.includes("can't answer") ||
      q.includes('cannot answer') ||
      q.includes('evaluate my answer') ||
      q.includes('evaluate me')
    ) {
      if (q.includes('voice') || q.includes('speak') || q.includes('microphone')) {
        return 'Yes! You can use voice in the AI Mock Interview (/stages/interview). Click "Voice Mode" in the top bar and click the microphone icon to speak. Your speech will transcribe automatically, and Dr. Elena Vance will speak back.';
      }
      if (q.includes("don't know") || q.includes('cannot answer') || q.includes("can't answer") || q.includes('not know an answer') || q.includes('not know a question')) {
        return 'If you do not know an answer, simply say "I don\'t know" or "I can\'t answer". The AI will acknowledge your response professionally, log the weakness, and move forward without abruptly ending the interview.';
      }
      if (q.includes('evaluate') || q.includes('evaluation') || q.includes('score')) {
        return 'Dr. Elena Vance analyzes every answer for technical depth, correctness, communication clarity, and domain terminology across 8 structured phases, generating an evaluation pill for each response.';
      }
      return 'Stage 4: AI Mock Interview (/stages/interview) simulates a realistic technical interview with Dr. Elena Vance across 8 phases. It supports both Text and Voice modes with deep real-time answer evaluation.';
    }

    // ================= SECTION 6: RESULTS & HISTORY =================
    if (q.includes('results') || q.includes('report') || q.includes('evaluation') || q.includes('score')) {
      return 'After finishing the 4 stages, click "End & Evaluate" or navigate to the Evaluation page (/stages/evaluation) to view your overall preparation percentage, stage scores, strengths, weaknesses, and recommendations.';
    }
    if (q.includes('previous') || q.includes('history') || q.includes('past')) {
      return 'You can view previous assessment attempts and scores by clicking the "History" button located in the top bar of both the Aptitude and Coding pages.';
    }

    // ================= GENERAL PLATFORM GUIDE =================
    if (q.includes('how do i use') || q.includes('how to use') || q.includes('guide')) {
      return 'SkillLab guides you through 4 sequential stages: 1) Resume Analysis, 2) Aptitude Assessment (10 questions), 3) Coding (5 problems), and 4) AI Mock Interview (8 phases with Dr. Elena Vance). Complete them to view your final readiness report!';
    }

    // Generic polite fallback
    return 'I am your SkillLab AI Help Assistant. Ask me anything about filling your Profile (Academic Background, Skills, Bio), or using Resume Analysis, Aptitude (10 questions), Coding (5 problems), the AI Mock Interview, or Dark Mode!';
  }
}
