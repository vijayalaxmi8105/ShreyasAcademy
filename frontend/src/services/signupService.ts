import { API_BASE_URL } from './api';

export interface SignupFormPayload {
  name: string;
  email: string;
  phoneNumber: string;
  fatherPhoneNumber: string;
  class: '11th' | '12th' | 'Dropper';
  state: 'Karnataka' | 'Andhra Pradesh' | 'Tamil Nadu' | 'Other';
}

const SIGNUP_ENDPOINT = '/api/auth/signup';

export async function submitSignupForm(payload: SignupFormPayload): Promise<void> {
  // When no backend is available, simulate a network latency to keep UX consistent.
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.info('Signup form payload (mock):', payload);
    return;
  }

  const response = await fetch(`${API_BASE_URL}${SIGNUP_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to submit signup form');
  }
}