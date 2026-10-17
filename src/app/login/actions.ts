'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export type LoginActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/admin',
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password.' };
        default:
          return { error: 'Authentication error. Please check credentials.' };
      }
    }
    // Rethrow redirect error so Next.js handles navigation
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
