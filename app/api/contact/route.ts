// app/api/contact/route.ts - Contact form API endpoint with validation
import { NextRequest, NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations/contact';
import { sanitizeHtml } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const data = await request.json();

    // Validate data with Zod
    const result = contactFormSchema.safeParse(data);
    
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    // Sanitize data
    const sanitized = {
      name: sanitizeHtml(result.data.name),
      email: sanitizeHtml(result.data.email),
      message: sanitizeHtml(result.data.message),
    };

    // Here you would send the email or save to database
    console.log('Contact form submission:', sanitized);

    // Simulate email sending
    // await sendEmail(sanitized);

    return NextResponse.json(
      { success: true, message: 'Message sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
