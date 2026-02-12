import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    icon: Sparkles,
    features: [
      "Create up to 3 moodboards",
      "Basic image upload (max 10 images per board)",
      "Standard resolution exports",
      "Community support",
      "Basic tags and organization",
    ],
    cta: "Get Started",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For serious creators",
    icon: Zap,
    features: [
      "Unlimited moodboards",
      "Unlimited images per board",
      "High-resolution exports (4K)",
      "Priority support",
      "Advanced tags and filters",
      "Custom color palettes",
      "Collaboration features",
      "Analytics dashboard",
    ],
    cta: "Upgrade to Pro",
    ctaVariant: "default" as const,
    popular: true,
  },
  {
    name: "Studio",
    price: "$29",
    period: "per month",
    description: "For teams and professionals",
    icon: Crown,
    features: [
      "Everything in Pro",
      "Team collaboration (up to 5 members)",
      "Brand kit integration",
      "API access",
      "White-label exports",
      "Dedicated account manager",
      "Custom integrations",
      "SSO authentication",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    popular: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm border-primary/30">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
              Simple Pricing
            </Badge>
            <h1 className="mt-6 font-serif text-5xl md:text-6xl font-light gradient-text">
              Choose Your Plan
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade when you're ready. No hidden fees, cancel anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full flex flex-col ${
                    plan.popular
                      ? "border-primary shadow-lg shadow-primary/10"
                      : "border-border"
                  } rounded-2xl overflow-hidden`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className={`pt-8 pb-6 ${plan.popular ? "pt-12" : ""}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        plan.popular ? "bg-primary text-primary-foreground" : "bg-secondary"
                      }`}>
                        <plan.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-serif text-2xl font-medium">{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      variant={plan.ctaVariant}
                      className={`w-full rounded-2xl h-12 ${
                        plan.popular
                          ? "gradient-gold border-0 text-primary-foreground hover:opacity-90"
                          : ""
                      }`}
                    >
                      <Link to={plan.name === "Studio" ? "/contact" : "/sign-up"}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-serif text-3xl font-light text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I switch plans at any time?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "Is there a free trial for Pro?",
                a: "Yes! Get 14 days of Pro features free. No credit card required to start.",
              },
              {
                q: "What happens to my boards if I downgrade?",
                a: "Your boards remain safe, but you'll only be able to edit your most recent 3 boards on the Free plan.",
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, we offer a 30-day money-back guarantee if you're not satisfied.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. No contracts, no commitments. Cancel whenever you want.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-sm"
              >
                <h3 className="font-medium text-lg mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="font-serif text-3xl font-light mb-4">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-6">
            Our team is here to help you find the perfect plan.
          </p>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
