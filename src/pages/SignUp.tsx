import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { emailService } from "@/lib/email-service";
import signupHero from "@/assets/signup-hero.jpg";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; birthDate?: string }>({});
  const navigate = useNavigate();
  const { signup } = useAuth();

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string; birthDate?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (!birthDate) {
      newErrors.birthDate = "Birth date is required";
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
    
    const success = await signup(name, email, password, birthDate);
    
    setIsLoading(false);
    
    if (success) {
      // Send welcome email
      await emailService.sendWelcomeEmail(email, name);
      
      toast({
        title: "Account created!",
        description: "Welcome to your studio. Check your email for a welcome message!",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Sign up failed",
        description: "An account with this email already exists.",
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
          className="w-full max-w-4xl"
        >
          <div className="overflow-hidden rounded-2xl bg-card shadow-card-hover border border-border/50 grid grid-cols-1 lg:grid-cols-2">
            {/* Left — Image panel (hidden on mobile) */}
            <div className="relative hidden lg:block">
              <img
                src={signupHero}
                alt="Fashion editorial"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-8">
                <p className="font-serif text-3xl font-light text-primary-foreground leading-tight">
                  Your aesthetic,
                  <br />
                  <span className="italic">your rules.</span>
                </p>
                <p className="mt-3 text-sm text-primary-foreground/70">
                  No likes · No followers · Just attitude
                </p>
                <div className="mt-6 flex gap-2">
                  {["#maximalist", "#80sluxury", "#chunkygold"].map((tag) => (
                    <Badge
                      key={tag}
                      className="gradient-gold border-0 text-primary-foreground text-xs rounded-2xl"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Form panel */}
            <div className="p-8 md:p-10">
              {/* Badge */}
              <div className="flex justify-center lg:justify-start">
                <Badge variant="outline" className="rounded-2xl px-4 py-1.5 text-sm border-primary/30">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
                  ✦ Join 1,200+ creators
                </Badge>
              </div>

              {/* Headline */}
              <h1 className="mt-6 text-center lg:text-left font-serif text-4xl font-light gradient-text">
                create your studio
              </h1>
              <p className="mt-2 text-center lg:text-left text-sm text-muted-foreground">
                start building your aesthetic identity
              </p>

              {/* Google */}
              <Button
                variant="outline"
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
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-12 rounded-2xl border-2 bg-secondary px-5 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Birth Date
                  </Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mt-2 h-12 rounded-2xl border-2 bg-secondary px-5 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                  />
                  {errors.birthDate && (
                    <p className="mt-1.5 text-xs text-destructive">{errors.birthDate}</p>
                  )}
                </div>

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
                  {errors.password ? (
                    <p className="mt-1.5 text-xs text-destructive">{errors.password}</p>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">at least 8 characters</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="mt-8 h-12 w-full rounded-2xl gradient-gold text-primary-foreground border-0 text-sm font-medium hover:opacity-90 transition-opacity shadow-amber disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              {/* Footer */}
              <p className="mt-10 text-center text-sm text-muted-foreground">
                already have an account?{" "}
                <Link
                  to="/sign-in"
                  className="text-primary font-medium hover:underline inline-flex items-center gap-1 group"
                >
                  sign in
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </p>

              {/* Terms */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <span className="underline cursor-pointer">Terms</span> and{" "}
                <span className="underline cursor-pointer">Privacy Policy</span>
              </p>

              {/* Trust */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>free forever · no credit card</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SignUp;
