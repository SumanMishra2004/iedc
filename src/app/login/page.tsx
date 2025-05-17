

import { LoginForm } from "@/components/login-form"
export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[url('/gpu.jpg')] bg-cover bg-no-repeat">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.8)_100%)]" />

      {/* Login Content */}
      <div className="relative z-20 flex w-full max-w-sm flex-col gap-6 box-shadow: rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset;">
        <LoginForm />
      </div>
    </div>
  );
}
