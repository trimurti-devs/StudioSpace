import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Sparkles, ArrowRight, Trash2, Eye, ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { type MockBoard } from "@/lib/mock-data";

interface LikedBoard extends MockBoard {
  likedAt: string;
  canvasImages?: Array<{
    id: string;
    url: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    zIndex: number;
  }>;
}


const LikedMoodboards = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [likedBoards, setLikedBoards] = useState<LikedBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Wait for auth to be checked before redirecting
    if (!authChecked) {
      // Small delay to allow auth context to load from localStorage
      const timer = setTimeout(() => {
        setAuthChecked(true);
      }, 100);
      return () => clearTimeout(timer);
    }

    // Redirect if not authenticated after auth check
    if (!isAuthenticated) {
      navigate("/sign-in");
      return;
    }


    const loadLikedBoards = () => {
      try {
        // Get liked boards from localStorage
        const likedData = localStorage.getItem(`liked_boards_${user?.email || "guest"}`);
        const likedIds: string[] = likedData ? JSON.parse(likedData) : [];

        const boards: LikedBoard[] = [];

        // Load full board data for each liked ID
        likedIds.forEach((id) => {
          const boardData = localStorage.getItem(`board_${id}`);
          if (boardData) {
            try {
              const parsed = JSON.parse(boardData);
              boards.push({
                ...parsed,
                likedAt: new Date().toISOString(), // In real app, store this when liking
              });
            } catch (e) {
              console.error("Failed to parse board:", e);
            }
          }
        });

        setLikedBoards(boards);
      } catch (error) {
        console.error("Failed to load liked boards:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLikedBoards();
  }, [isAuthenticated, navigate, user, authChecked]);


  const handleUnlike = (boardId: string) => {
    try {
      const storageKey = `liked_boards_${user?.email || "guest"}`;
      const likedData = localStorage.getItem(storageKey);
      const likedIds: string[] = likedData ? JSON.parse(likedData) : [];
      
      const updated = likedIds.filter((id) => id !== boardId);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      
      setLikedBoards((prev) => prev.filter((b) => b.id !== boardId));
      
      toast({
        title: "Removed from likes",
        description: "Board has been removed from your liked collection",
      });
    } catch (error) {
      console.error("Failed to unlike board:", error);
    }
  };

  const handleGoToInspire = () => {
    navigate("/inspire");
  };

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">
            <Heart className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            <h1 className="font-serif text-4xl font-light text-foreground">
              Liked Moodboards
            </h1>
          </div>
          <p className="text-muted-foreground">
            {likedBoards.length > 0 
              ? `You have liked ${likedBoards.length} moodboard${likedBoards.length === 1 ? "" : "s"}`
              : "Start exploring and like moodboards to save them here"
            }
          </p>
        </motion.div>

        {likedBoards.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center py-16"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-secondary mx-auto mb-6">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl text-foreground mb-3">
              No Liked Moodboards Yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Explore the Inspiration Roulette to discover amazing moodboards from the community. 
              Like the ones that inspire you!
            </p>
            <Button
              onClick={handleGoToInspire}
              className="rounded-2xl gradient-gold border-0 text-primary-foreground px-8 h-12 hover:opacity-90"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Discover Moodboards
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        ) : (
          // Liked Boards Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedBoards.map((board, index) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative rounded-2xl bg-card shadow-card border border-border/50 overflow-hidden hover:shadow-card-hover transition-all"
              >
                {/* Preview */}
                <div className="relative aspect-video bg-secondary overflow-hidden">
                  {board.canvasImages && board.canvasImages.length > 0 ? (
                    <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                      {board.canvasImages.slice(0, 4).map((img: any, idx: number) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                  ) : board.images && board.images.length > 0 ? (
                    <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                      {board.images.slice(0, 4).map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Actions */}
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 rounded-xl bg-background/90 backdrop-blur-sm hover:bg-background"
                    >
                      <Link to={`/canvas?id=${board.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUnlike(board.id)}
                      className="rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-serif text-lg text-foreground truncate">
                    {board.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    by {board.username}
                  </p>
                  
                  {board.tags && board.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {board.tags.slice(0, 3).map((tag: string) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="rounded-full text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unlike Button (always visible) */}
                <button
                  onClick={() => handleUnlike(board.id)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                  title="Remove from likes"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Discover More CTA */}
        {likedBoards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Button
              onClick={handleGoToInspire}
              variant="outline"
              className="rounded-2xl px-8 h-12"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Discover More Moodboards
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LikedMoodboards;
