import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { type MockBoard, formatTimeAgo } from "@/lib/mock-data";
import { motion } from "framer-motion";

interface BoardCardProps {
  board: MockBoard;
  index: number;
}

export function BoardCard({ board, index }: BoardCardProps) {
  const maxVisibleTags = 3;
  const extraTags = board.tags.length - maxVisibleTags;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/board/${board.id}`}
        className="group block overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
      >
        {/* 2x2 image grid */}
        <div className="grid grid-cols-2 gap-0.5 overflow-hidden">
          {board.images.slice(0, 4).map((img, i) => (
            <div key={i} className="aspect-square overflow-hidden">
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Card info */}
        <div className="p-4">
          <h3 className="font-serif text-lg font-medium text-card-foreground leading-tight">
            {board.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
            <span>@{board.username}</span>
            <span>·</span>
            <span>{formatTimeAgo(board.createdAt)}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {board.viewCount}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {board.tags.slice(0, maxVisibleTags).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-2xl text-xs font-sans text-muted-foreground border-border"
              >
                {tag}
              </Badge>
            ))}
            {extraTags > 0 && (
              <Badge
                variant="outline"
                className="rounded-2xl text-xs font-sans text-muted-foreground border-border"
              >
                +{extraTags}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
