import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Zod schemas ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
  )
}

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label="Continue with Google"
      className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {/* Google logo SVG */}
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
        />
      </svg>
      Continue with Google
    </button>
  )
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setServerError(null)
    try {
      await signInWithEmail(data.email, data.password)
      onSuccess()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign-in failed')
    }
  }

  const handleGoogle = async (): Promise<void> => {
    setGoogleLoading(true)
    setServerError(null)
    try {
      await signInWithGoogle()
      onSuccess()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register('email')}
          className="mt-1"
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register('password')}
          className="mt-1"
        />
        <FieldError message={errors.password?.message} />
      </div>

      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
        {isSubmitting ? 'Signing in…' : 'Sign In'}
      </Button>

      <div className="relative flex items-center gap-2">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <GoogleButton onClick={handleGoogle} loading={isSubmitting || googleLoading} />
    </form>
  )
}

// ── Register form ─────────────────────────────────────────────────────────────

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setServerError(null)
    try {
      await signUpWithEmail(data.email, data.password, data.displayName)
      onSuccess()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  const handleGoogle = async (): Promise<void> => {
    setGoogleLoading(true)
    setServerError(null)
    try {
      await signInWithGoogle()
      onSuccess()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <Label htmlFor="reg-name">Full Name</Label>
        <Input
          id="reg-name"
          type="text"
          autoComplete="name"
          placeholder="Rohan Sharma"
          aria-invalid={!!errors.displayName}
          {...register('displayName')}
          className="mt-1"
        />
        <FieldError message={errors.displayName?.message} />
      </div>

      <div>
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register('email')}
          className="mt-1"
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          aria-invalid={!!errors.password}
          {...register('password')}
          className="mt-1"
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div>
        <Label htmlFor="reg-confirm">Confirm Password</Label>
        <Input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          aria-invalid={!!errors.confirmPassword}
          {...register('confirmPassword')}
          className="mt-1"
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
        {isSubmitting ? 'Creating account…' : 'Create Account'}
      </Button>

      <div className="relative flex items-center gap-2">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <GoogleButton onClick={handleGoogle} loading={isSubmitting || googleLoading} />
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const currentUser = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()

  // Already authenticated — skip the auth page entirely
  if (currentUser) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  const handleSuccess = (): void => {
    navigate(ROUTES.DASHBOARD, { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary"
            aria-hidden="true"
          >
            <span className="text-xl font-bold text-primary-foreground">₹</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">FinTrack</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your personal expense &amp; budget tracker
          </p>
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Authentication options"
          className="mb-6 flex rounded-lg border border-border bg-muted p-1"
        >
          <button
            role="tab"
            aria-selected={tab === 'login'}
            aria-controls="panel-login"
            id="tab-login"
            onClick={() => setTab('login')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={tab === 'register'}
            aria-controls="panel-register"
            id="tab-register"
            onClick={() => setTab('register')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form panels */}
        <div
          id="panel-login"
          role="tabpanel"
          aria-labelledby="tab-login"
          hidden={tab !== 'login'}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <LoginForm onSuccess={handleSuccess} />
        </div>

        <div
          id="panel-register"
          role="tabpanel"
          aria-labelledby="tab-register"
          hidden={tab !== 'register'}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <RegisterForm onSuccess={handleSuccess} />
        </div>
      </div>
    </main>
  )
}
