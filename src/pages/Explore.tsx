import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BoardGrid } from "@/components/BoardGrid";
import { TagCloud } from "@/components/TagCloud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, TrendingUp, Clock, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { MOCK_BOARDS, POPULAR_TAGS } from "@/lib/mock-data";

const BOARDS_PER_PAGE = 9;

const Explore = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(BOARDS_PER_PAGE);
  const [sortBy, setSortBy] = useState<"trending" | "recent" | "popular">("trending");

  // Filter boards by tag and search query
  let filtered = activeTag
    ? MOCK_BOARDS.filter((b) => b.tags.includes(activeTag))
    : [...MOCK_BOARDS];

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.username.toLowerCase().includes(query) ||
        b.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  // Sort boards
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "trending":
        return b.viewCount - a.viewCount;
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "popular":
        return b.tags.length - a.tags.length;
      default:
        return 0;
    }
  });

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header Section */}
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="font-serif text-5xl md:text-6xl font-light gradient-text">
              Explore
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover moodboards from creators worldwide. Find inspiration for your next aesthetic project.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search moodboards, creators, or tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(BOARDS_PER_PAGE);
                }}
                className="pl-12 h-14 rounded-2xl border-2 bg-secondary text-base focus-visible:ring-4 focus-visible:ring-primary/20"
              />
            </div>
          </motion.div>

          {/* Sort Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 flex items-center justify-center gap-2 flex-wrap"
          >
            <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
            <Button
              variant={sortBy === "trending" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("trending")}
              className={`rounded-full ${sortBy === "trending" ? "gradient-gold border-0" : ""}`}
            >
              <TrendingUp className="mr-2 h-4 w-4" /> Trending
            </Button>
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className={`rounded-full ${sortBy === "recent" ? "gradient-gold border-0" : ""}`}
            >
              <Clock className="mr-2 h-4 w-4" /> Recent
            </Button>
            <Button
              variant={sortBy === "popular" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("popular")}
              className={`rounded-full ${sortBy === "popular" ? "gradient-gold border-0" : ""}`}
            >
              <Heart className="mr-2 h-4 w-4" /> Popular
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Tags Section */}
      <section className="pb-8 px-4">
        <div className="container mx-auto">
          <TagCloud
            tags={POPULAR_TAGS}
            activeTag={activeTag}
            onTagClick={(tag) => {
              setActiveTag(tag);
              setVisibleCount(BOARDS_PER_PAGE);
            }}
            onClear={() => setActiveTag(null)}
          />
        </div>
      </section>

      {/* Results Count */}
      <section className="px-4 pb-4">
        <div className="container mx-auto">
          <p className="text-sm text-muted-foreground">
            Showing {visible.length} of {sorted.length} moodboards
          </p>
        </div>
      </section>

      {/* Board Grid */}
      <main className="flex-1 pb-16 px-4">
        <div className="container mx-auto">
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

          {visible.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground">No moodboards found matching your criteria.</p>
              <Button
                variant="outline"
                className="mt-4 rounded-2xl"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTag(null);
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Explore;
