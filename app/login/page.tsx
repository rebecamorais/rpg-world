import Link from 'next/link';

import AuthRedirect from '@/frontend/components/AuthRedirect';
import LoginForm from '@/frontend/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center p-4">
      <AuthRedirect />
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          &larr; Voltar
        </Link>
      </div>
      <LoginForm />
    </div>
  );
}
