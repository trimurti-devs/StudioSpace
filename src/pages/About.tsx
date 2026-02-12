import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Heart, Users, Target, Mail, Twitter, Instagram, Github } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";


const values = [
  {
    icon: Sparkles,
    title: "Creativity First",
    description: "We believe in the power of visual expression. Every feature is designed to help you bring your aesthetic vision to life.",
  },
  {
    icon: Heart,
    title: "No Vanity Metrics",
    description: "No likes, no followers, no algorithms. Just pure creative expression without the pressure of performance.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by creators, for creators. We listen to our community and evolve based on real needs.",
  },
  {
    icon: Target,
    title: "Quality Over Quantity",
    description: "We focus on building tools that matter, not bloated features. Every pixel has a purpose.",
  },
];

const team = [
  {
    name: "Alex Chen",
    role: "Founder & Designer",
    bio: "Former Pinterest designer with a passion for visual storytelling.",
  },
  {
    name: "Sam Rivera",
    role: "Lead Developer",
    bio: "Full-stack engineer obsessed with performance and user experience.",
  },
  {
    name: "Jordan Park",
    role: "Community Manager",
    bio: "Creative director turned community builder. Here to help you shine.",
  },
];

const stats = [
  { value: "10K+", label: "Active Creators" },
  { value: "50K+", label: "Moodboards Created" },
  { value: "1M+", label: "Images Curated" },
  { value: "120+", label: "Countries" },
];

const About = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartBuilding = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/sign-up");
    }
  };

  return (

    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm border-primary/30">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
              Our Story
            </Badge>
            <h1 className="mt-6 font-serif text-5xl md:text-6xl font-light gradient-text">
              The Studio, Not the Stage
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Studio Space was born from a simple frustration: creative platforms had become 
              popularity contests. We wanted to build a space where creators could focus on 
              their craft without the pressure of algorithms and vanity metrics.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Here, your moodboards are your studio—a private space to experiment, iterate, 
              and refine your aesthetic identity. Share when you're ready, or keep it to yourself. 
              The choice is yours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="font-serif text-4xl md:text-5xl font-light gradient-text">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-light gradient-text">Our Values</h2>
            <p className="mt-4 text-muted-foreground">The principles that guide everything we build</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full rounded-2xl border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-medium mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-light gradient-text">Meet the Team</h2>
            <p className="mt-4 text-muted-foreground">The humans behind Studio Space</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center text-primary-foreground text-2xl font-serif">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-serif text-xl font-medium">{member.name}</h3>
                <p className="text-sm text-primary font-medium mt-1">{member.role}</p>
                <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl font-light gradient-text">Get in Touch</h2>
            <p className="mt-4 text-muted-foreground">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>
          
          <Card className="rounded-2xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Contact Us</h3>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-5 w-5" />
                    <span>hello@studiospace.app</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24 hours during business days.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Follow Us</h3>
                  <div className="flex gap-4">
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto text-center">
          <h2 className="font-serif text-3xl font-light mb-4">
            Ready to start creating?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of creators who are building their aesthetic identity on Studio Space.
          </p>
          <Button
            size="lg"
            onClick={handleStartBuilding}
            className="rounded-2xl gradient-gold border-0 text-primary-foreground hover:opacity-90"
          >
            Start Building Free
          </Button>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
