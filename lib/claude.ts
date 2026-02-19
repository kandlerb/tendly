import { supabase } from './supabase';

export async function inviteTenant(params: {
  unitId: string;
  email: string;
  rentAmount: number;
  depositAmount: number;
  startDate: string;
  endDate: string;
}) {
  const { data, error } = await supabase.functions.invoke('invite-tenant', { body: params });
  if (error) throw error;
  return data as { invitationId: string; token: string };
}

export async function completeInvitation(token: string) {
  const { data, error } = await supabase.functions.invoke('complete-invitation', { body: { token } });
  if (error) throw error;
  return data as { lease: any; unit: any; property: any };
}

export async function getSignedUrl(documentId: string) {
  const { data, error } = await supabase.functions.invoke('get-signed-url', { body: { documentId } });
  if (error) throw error;
  return data as { signedUrl: string; expiresAt: string };
}

export async function acknowledgeDocument(documentId: string) {
  const { data, error } = await supabase.functions.invoke('acknowledge-document', { body: { documentId } });
  if (error) throw error;
  return data as { acknowledgedAt: string };
}

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
