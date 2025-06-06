
import React, { Suspense } from 'react';
import { SignupForm, SignupFormFallback } from './signup-form';

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFormFallback />}>
      <SignupForm />
    </Suspense>
  );
}
    