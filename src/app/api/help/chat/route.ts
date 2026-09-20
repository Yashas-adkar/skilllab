import { NextRequest, NextResponse } from 'next/server';
import { HelpChatbotService } from '@/services/ai/help-chatbot.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message = '', pathname = '', history = [] } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { reply: 'Please ask a question about how to use the platform.' },
        { status: 400 }
      );
    }

    const reply = await HelpChatbotService.getHelpResponse({
      message,
      pathname,
      history,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Help chatbot route error:', error);
    return NextResponse.json({
      reply:
        "I'm having trouble responding right now. Please try again in a moment.",
    });
  }
}
