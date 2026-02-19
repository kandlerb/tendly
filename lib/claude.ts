import { supabase } from './supabase';

export async function callTriage(title: string, description: string) {
  const { data, error } = await supabase.functions.invoke('triage', {
    body: { title, description },
  });
  if (error) throw error;
  return data as { urgency: string; trade: string };
}

export async function callDraftMessage(
  scenario: string,
  tenantName: string,
  propertyAddress: string,
  landlordName: string
) {
  const { data, error } = await supabase.functions.invoke('draft-message', {
    body: { scenario, tenantName, propertyAddress, landlordName },
  });
  if (error) throw error;
  return (data as { draft: string }).draft;
}
