import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  const { title, description } = await req.json();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are a property maintenance triage assistant. Given a maintenance request, return ONLY a JSON object with two fields:
- urgency: "emergency" | "urgent" | "routine"
- trade: "plumbing" | "electrical" | "hvac" | "general"

Maintenance request title: "${title}"
Description: "${description}"

Rules:
- emergency: No heat in winter, flooding, gas leak, no hot water, security issue
- urgent: Appliance failure, pest issue, minor leak
- routine: Cosmetic issues, non-critical repairs

Respond with only the JSON, no explanation.`,
    }],
  });

  const text = (message.content[0] as { text: string }).text;
  const result = JSON.parse(text);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
