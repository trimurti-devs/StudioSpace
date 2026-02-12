import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TagCloud } from "@/components/TagCloud";
import { BoardGrid } from "@/components/BoardGrid";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MOCK_BOARDS, POPULAR_TAGS } from "@/lib/mock-data";

const BOARDS_PER_PAGE = 6;

const Index = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(BOARDS_PER_PAGE);

  const filtered = activeTag
    ? MOCK_BOARDS.filter((b) => b.tags.includes(activeTag))
    : MOCK_BOARDS;

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Hero />
      <TagCloud
        tags={POPULAR_TAGS}
        activeTag={activeTag}
        onTagClick={(tag) => {
          setActiveTag(tag);
          setVisibleCount(BOARDS_PER_PAGE);
        }}
        onClear={() => setActiveTag(null)}
      />
      <main className="flex-1 pb-16">
        <BoardGrid boards={visible} />
        {hasMore && (
          <div className="mt-10 text-center">
            <Button
              variant="outline"
              className="rounded-2xl px-8"
              onClick={() => setVisibleCount((c) => c + BOARDS_PER_PAGE)}
            >
              Load More
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
