import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  const { messages, portfolioContext } = await req.json();

  const systemPrompt = `You are Tend, an AI assistant for independent landlords. You help with:
- Landlord-tenant law questions (state-specific when context is provided)
- Maintenance troubleshooting and vendor guidance
- Financial calculations (ROI, cap rate, cash flow)
- Drafting professional communications

Portfolio context:
${portfolioContext}

IMPORTANT: You are not a lawyer. For legal questions, always provide an informed starting point and remind the user to verify with a local attorney or their state's landlord-tenant resource. Never give definitive legal advice.`;

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
});
