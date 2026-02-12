import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { motion } from "framer-motion";

interface TagCloudProps {
  tags: string[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
  onClear: () => void;
}

export function TagCloud({ tags, activeTag, onTagClick, onClear }: TagCloudProps) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {tags.map((tag, i) => (
          <motion.div
            key={tag}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
          >
            <Badge
              variant={activeTag === tag ? "default" : "outline"}
              className={`cursor-pointer rounded-2xl px-4 py-1.5 text-sm font-sans transition-all hover:shadow-card-hover ${
                activeTag === tag
                  ? "gradient-gold text-primary-foreground border-0"
                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onTagClick(tag)}
            >
              {tag}
              {activeTag === tag && (
                <X
                  className="ml-1.5 h-3 w-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                />
              )}
            </Badge>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
