import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shuffle, 
  Heart, 
  Eye, 
  Sparkles, 
  ArrowRight, 
  Plus,
  RefreshCw,
  ImageIcon,
  Lock,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { type MockBoard } from "@/lib/mock-data";

interface BoardWithLikes extends MockBoard {
  likes?: number;
  isLiked?: boolean;
  canvasImages?: Array<{
    id: string;
    url: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    zIndex: number;
  }>;
}


const InspirationRoulette = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [boards, setBoards] = useState<BoardWithLikes[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewedCount, setViewedCount] = useState(0);

  // Load boards from localStorage
  useEffect(() => {
    const loadBoards = () => {
      const loadedBoards: BoardWithLikes[] = [];
      
      // Get user's liked boards
      const storageKey = `liked_boards_${user?.email || "guest"}`;
      const likedData = localStorage.getItem(storageKey);
      const likedIds: string[] = likedData ? JSON.parse(likedData) : [];
      
      // Scan localStorage for all board keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("board_")) {
          try {
            const boardData = JSON.parse(localStorage.getItem(key) || "{}");
            // Only show public boards or user's own boards
            if (boardData.isPublic || (user && boardData.username === user.name)) {
              const isLiked = likedIds.includes(boardData.id);
              loadedBoards.push({
                ...boardData,
                likes: isLiked ? 1 : 0, // Show 1 if user liked it
                isLiked: isLiked,
              });

            }
          } catch (e) {
            console.error("Failed to parse board:", e);
          }
        }
      }

      // Shuffle the boards
      const shuffled = loadedBoards.sort(() => Math.random() - 0.5);
      setBoards(shuffled);
      setLoading(false);
    };

    loadBoards();
  }, [user]);


  const currentBoard = boards[currentIndex];

  const handleShuffle = useCallback(() => {
    if (boards.length <= 1) return;
    
    setIsShuffling(true);
    setViewedCount(prev => prev + 1);
    
    // Animation delay before changing
    setTimeout(() => {
      setCurrentIndex((prev) => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * boards.length);
        } while (nextIndex === prev && boards.length > 1);
        return nextIndex;
      });
      setIsShuffling(false);
    }, 600);
  }, [boards.length]);

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in to like",
        description: "Create an account to save your favorite moodboards",
        variant: "destructive",
      });
      navigate("/sign-in");
      return;
    }

    if (!currentBoard) return;

    const isCurrentlyLiked = currentBoard.isLiked;
    const storageKey = `liked_boards_${user?.email || "guest"}`;
    
    // Get current liked boards
    const likedData = localStorage.getItem(storageKey);
    let likedIds: string[] = likedData ? JSON.parse(likedData) : [];

    if (isCurrentlyLiked) {
      // Unlike: remove from localStorage
      likedIds = likedIds.filter((id) => id !== currentBoard.id);
    } else {
      // Like: add to localStorage
      if (!likedIds.includes(currentBoard.id)) {
        likedIds.push(currentBoard.id);
      }
    }
    
    localStorage.setItem(storageKey, JSON.stringify(likedIds));

    setBoards((prev) =>
      prev.map((board, idx) =>
        idx === currentIndex
          ? {
              ...board,
              isLiked: !board.isLiked,
              likes: board.isLiked ? (board.likes || 0) - 1 : (board.likes || 0) + 1,
            }
          : board
      )
    );

    toast({
      title: isCurrentlyLiked ? "Removed from likes" : "Added to likes!",
      description: isCurrentlyLiked ? "Board removed from your collection" : "Board saved to your likes",
    });
  };


  const handleViewBoard = () => {
    if (currentBoard) {
      navigate(`/canvas?id=${currentBoard.id}`);
    }
  };

  const handleCreateBoard = () => {
    navigate("/canvas");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-10 pt-24">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-secondary mx-auto">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="font-serif text-4xl font-light text-foreground">
                No Moodboards Yet
              </h1>
              <p className="text-muted-foreground text-lg">
                Be the first to create a moodboard! Once boards are created, 
                you can shuffle through them for inspiration.
              </p>
              <Button
                onClick={handleCreateBoard}
                className="rounded-2xl gradient-gold border-0 text-primary-foreground px-8 h-12 hover:opacity-90"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Moodboard
              </Button>
            </motion.div>
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
          className="text-center mb-8"
        >
          <Badge variant="outline" className="rounded-2xl mb-4 border-primary/30">
            <Shuffle className="mr-1 h-3 w-3 text-primary" />
            Random Discovery
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Inspiration Roulette
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discover random moodboards from the community. Click shuffle to find your next inspiration!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Viewed {viewedCount} boards • {boards.length} total available
          </p>
        </motion.div>

        {/* Main Card */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {currentBoard && (
              <motion.div
                key={currentBoard.id}
                initial={{ opacity: 0, rotateY: -90, scale: 0.8 }}
                animate={{ 
                  opacity: isShuffling ? 0 : 1, 
                  rotateY: isShuffling ? 90 : 0,
                  scale: isShuffling ? 0.8 : 1 
                }}
                exit={{ opacity: 0, rotateY: 90, scale: 0.8 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="relative"
              >
                <div className="rounded-3xl bg-card shadow-card-hover border border-border/50 overflow-hidden">
                  {/* Board Preview */}
                  <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
                    {currentBoard.canvasImages && currentBoard.canvasImages.length > 0 ? (
                      <div className="absolute inset-0 grid grid-cols-2 gap-1 p-4">
                        {currentBoard.canvasImages.slice(0, 4).map((img: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="relative rounded-xl overflow-hidden bg-background"
                          >
                            <img
                              src={img.url}
                              alt={`Board image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {currentBoard.canvasImages.length === 0 && (
                          <div className="col-span-2 flex items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    ) : currentBoard.images && currentBoard.images.length > 0 ? (
                      <div className="absolute inset-0 grid grid-cols-2 gap-1 p-4">
                        {currentBoard.images.slice(0, 4).map((img: string, idx: number) => (
                          <div 
                            key={idx} 
                            className="relative rounded-xl overflow-hidden bg-background"
                          >
                            <img
                              src={img}
                              alt={`Board image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-24 w-24 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {/* Privacy Badge */}
                    <Badge 
                      className={`absolute top-4 right-4 rounded-2xl ${
                        currentBoard.isPublic 
                          ? "bg-emerald-500/90 text-primary-foreground border-0" 
                          : "bg-foreground/70 text-primary-foreground border-0"
                      }`}
                    >
                      {currentBoard.isPublic ? (
                        <><Globe className="mr-1 h-3 w-3" /> Public</>
                      ) : (
                        <><Lock className="mr-1 h-3 w-3" /> Private</>
                      )}
                    </Badge>

                    {/* Like Button */}
                    <button
                      onClick={handleLike}
                      className="absolute top-4 left-4 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Heart 
                        className={`h-5 w-5 ${currentBoard.isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} 
                      />
                    </button>
                  </div>

                  {/* Board Info */}
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                          {currentBoard.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          by {currentBoard.username} • {new Date(currentBoard.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        {currentBoard.viewCount || 0}
                      </div>

                    </div>

                    {/* Tags */}
                    {currentBoard.tags && currentBoard.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {currentBoard.tags.map((tag: string) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="rounded-2xl text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleViewBoard}
                        className="rounded-2xl gradient-gold border-0 text-primary-foreground hover:opacity-90 flex-1 md:flex-none"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Board
                      </Button>
                      <Button
                        onClick={handleLike}
                        variant="outline"
                        className={`rounded-2xl flex-1 md:flex-none ${currentBoard.isLiked ? "border-red-300 bg-red-50" : ""}`}
                      >
                        <Heart className={`mr-2 h-4 w-4 ${currentBoard.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                        {currentBoard.isLiked ? "Saved" : "Save"}
                      </Button>

                      <Button
                        onClick={handleShuffle}
                        disabled={isShuffling}
                        variant="outline"
                        className="rounded-2xl flex-1 md:flex-none"
                      >
                        {isShuffling ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Shuffle className="mr-2 h-4 w-4" />
                        )}
                        Shuffle
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shuffle Button (Large) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <Button
              onClick={handleShuffle}
              disabled={isShuffling}
              size="lg"
              className="rounded-2xl h-14 px-8 text-lg gradient-dark border-0 text-primary-foreground hover:opacity-90"
            >
              {isShuffling ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Shuffling...
                </>
              ) : (
                <>
                  <Shuffle className="mr-2 h-5 w-5" />
                  Shuffle Again
                </>
              )}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Press spacebar to shuffle quickly
            </p>
          </motion.div>

          {/* Keyboard Shortcut Hint */}
          <div className="mt-8 flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs">Space</kbd> Shuffle
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs">L</kbd> Like
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs">Enter</kbd> View
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InspirationRoulette;
