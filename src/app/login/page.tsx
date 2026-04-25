import { PublicTopBar } from '@/components/public/public-top-bar';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <PublicTopBar current="login" />

      <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 pb-8 pt-4 sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/5 p-8 shadow-xl backdrop-blur-xl">
          <h1 className="mb-2 text-center text-2xl font-bold text-white">
            Welcome to LinkChat
          </h1>
          <p className="mb-8 text-center text-sm text-gray-400">
            Sign in to manage your page
          </p>

          <div className="space-y-3">
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    </div>
  );
}
