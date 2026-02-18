import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  const { scenario, tenantName, propertyAddress, landlordName } = await req.json();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Draft a professional landlord message for the following scenario.
Landlord: ${landlordName}
Tenant: ${tenantName}
Property: ${propertyAddress}
Scenario: ${scenario}

Write only the message body. Be professional, clear, and empathetic. Do not include a subject line.`,
    }],
  });

  const draft = (message.content[0] as { text: string }).text;
  return new Response(JSON.stringify({ draft }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
