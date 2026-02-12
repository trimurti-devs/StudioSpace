import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    const success = await login(email, password);
    
    setIsLoading(false);
    
    if (success) {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to your studio.",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Sign in failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="glass" />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl bg-card p-8 md:p-10 shadow-card-hover border border-border/50">
            {/* Badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="rounded-2xl px-4 py-1.5 text-sm border-primary/30">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
                ✦ 1,200+ creators
              </Badge>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-center font-serif text-4xl font-light gradient-text">
              welcome back
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              your aesthetic journey continues here
            </p>

            {/* Google */}
            <Button
              variant="outline"
              onClick={async () => {
                const success = await loginWithGoogle();
                if (success) {
                  toast({
                    title: "Welcome!",
                    description: "You've successfully signed in with Google.",
                  });
                  navigate("/dashboard");
                } else {
                  toast({
                    title: "Sign in failed",
                    description: "Google sign in failed. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              className="mt-8 h-12 w-full rounded-2xl border-2 text-sm font-medium hover:border-primary/50 transition-colors"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
              <Badge className="gradient-gold border-0 text-primary-foreground text-xs px-3 py-0.5 rounded-2xl">
                OR
              </Badge>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email address
                </Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 rounded-2xl border-2 bg-secondary px-5 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-2xl border-2 bg-secondary px-5 pr-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className="mt-8 h-12 w-full rounded-2xl gradient-dark text-primary-foreground border-0 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>

            {/* Footer */}
            <p className="mt-10 text-center text-sm text-muted-foreground">
              first time here?{" "}
              <Link
                to="/sign-up"
                className="text-primary font-medium hover:underline inline-flex items-center gap-1 group"
              >
                create your studio
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </p>

            {/* Trust */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>✨🎨⚡</span>
              <span>trusted by creators worldwide</span>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SignIn;
