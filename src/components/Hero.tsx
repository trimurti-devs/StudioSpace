import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Subtle amber glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-6xl md:text-8xl lg:text-9xl font-light tracking-tight gradient-text"
        >
          STUDIO SPACE
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-6 font-serif text-xl md:text-2xl text-foreground/80 italic"
        >
          The studio for your aesthetic identity
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-3 text-sm tracking-widest uppercase text-muted-foreground"
        >
          No likes · No followers · Just attitude
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-10"
        >
          <Button
            asChild
            size="lg"
            className="gradient-gold border-0 text-primary-foreground rounded-2xl px-8 h-12 text-base font-medium hover:opacity-90 shadow-amber transition-all"
          >
            <Link to="/sign-up">Start Building Free</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
