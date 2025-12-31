import { API_BASE_URL } from './api';

export interface ContactFormPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const CONTACT_ENDPOINT = '/api/contact';

export async function submitContactForm(payload: ContactFormPayload): Promise<void> {
  // When no backend is available, simulate a network latency to keep UX consistent.
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.info('Contact form payload (mock):', payload);
    return;
  }

  const response = await fetch(`${API_BASE_URL}${CONTACT_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to submit contact form');
  }
}