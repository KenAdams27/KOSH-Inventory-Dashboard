
import Link from "next/link"
import { Boxes } from "lucide-react"

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Boxes className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
        <p className="text-muted-foreground">This is where the sign-up form will go.</p>
        <Link href="/" className="mt-4 text-sm underline">
            Back to login
        </Link>
    </main>
  )
}
