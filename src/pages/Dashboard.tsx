import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Lock, Globe, Grid3X3, Trash2, Copy, Loader2, Share2, Link2, Eye, EyeOff } from "lucide-react";
import { formatTimeAgo, type MockBoard } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Dashboard = () => {
  const [boards, setBoards] = useState<MockBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [shareBoard, setShareBoard] = useState<MockBoard | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const navigate = useNavigate();

  // Load boards from localStorage on mount
  useEffect(() => {
    const loadBoards = () => {
      const loadedBoards: MockBoard[] = [];
      
      // Iterate through localStorage to find all boards
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("board_")) {
          try {
            const boardData = localStorage.getItem(key);
            if (boardData) {
              const parsed = JSON.parse(boardData);
              // Convert date strings back to Date objects
              loadedBoards.push({
                ...parsed,
                createdAt: new Date(parsed.createdAt),
                updatedAt: new Date(parsed.updatedAt),
              });
            }
          } catch (error) {
            console.error("Failed to parse board:", key, error);
          }
        }
      }
      
      // Sort by updatedAt (most recent first)
      loadedBoards.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setBoards(loadedBoards);
      setLoading(false);
    };

    loadBoards();
    
    // Reload boards when window gains focus (in case changes were made in other tabs)
    const handleFocus = () => loadBoards();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleCreateNewBoard = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      setIsCreating(true);
      
      // Simulate API call to create board
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Create new board object
      const newBoard: MockBoard = {
        id: crypto.randomUUID(),
        title: "Untitled Moodboard",
        username: "current_user",
        images: [],
        tags: [],
        viewCount: 0,
        createdAt: new Date(),
        isPublic: false,
        updatedAt: new Date(),
      };
      
      // Save to localStorage
      localStorage.setItem(`board_${newBoard.id}`, JSON.stringify(newBoard));
      
      // Update state
      setBoards((prev) => [newBoard, ...prev]);
      
      toast({
        title: "✨ Board created!",
        description: "Your new moodboard is ready for inspiration.",
      });
      
      // Navigate to canvas with the new board ID
      navigate(`/canvas?id=${newBoard.id}`);
      
    } catch (error) {
      console.error("Failed to create board:", error);
      toast({
        title: "Error",
        description: "Failed to create board. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    
    // Remove from localStorage
    localStorage.removeItem(`board_${deleteId}`);
    
    // Update state
    setBoards((prev) => prev.filter((b) => b.id !== deleteId));
    setDeleteId(null);
    
    toast({
      title: "Board deleted",
      description: "The moodboard has been permanently removed.",
    });
  };

  const handleDuplicate = (board: MockBoard) => {
    const duplicatedBoard: MockBoard = {
      ...board,
      id: crypto.randomUUID(),
      title: `${board.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
    };
    
    localStorage.setItem(`board_${duplicatedBoard.id}`, JSON.stringify(duplicatedBoard));
    setBoards((prev) => [duplicatedBoard, ...prev]);
    
    toast({
      title: "Board duplicated",
      description: "A copy of the moodboard has been created.",
    });
  };

  const handleShare = (board: MockBoard) => {
    setShareBoard(board);
    setSharePassword("");
    setShareLink("");
    setShowPassword(false);
  };

  const generateShareLink = () => {
    if (!shareBoard) return;
    
    // Generate a share token
    const shareToken = crypto.randomUUID();
    const shareData = {
      boardId: shareBoard.id,
      password: sharePassword || null,
      createdAt: new Date().toISOString(),
      expiresAt: null, // No expiration for now
    };
    
    // Store share data
    localStorage.setItem(`share_${shareToken}`, JSON.stringify(shareData));
    
    // Generate the full link
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/shared/${shareToken}`;
    setShareLink(link);
    
    toast({
      title: "Share link created!",
      description: sharePassword 
        ? "Password-protected link ready to share with clients."
        : "Public link ready to share.",
    });
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard.",
    });
  };

  const closeShareDialog = () => {
    setShareBoard(null);
    setSharePassword("");
    setShareLink("");
    setShowPassword(false);
  };

  const isEmpty = boards.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar variant="dashboard" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="dashboard" onCreateBoard={handleCreateNewBoard} />

      <main className="flex-1 container mx-auto px-4 py-10 pt-24">
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-light text-foreground">Your studio</h1>
          <p className="mt-1 text-muted-foreground">
            {isEmpty ? "No moodboards yet" : `You have ${boards.length} moodboard${boards.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <Grid3X3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-6 font-serif text-2xl text-foreground">No moodboards yet</h2>
            <p className="mt-2 text-muted-foreground">Start building your aesthetic identity</p>
            <Button
              onClick={handleCreateNewBoard}
              disabled={isCreating}
              type="button"
              className="mt-6 gradient-gold border-0 text-primary-foreground rounded-2xl px-8 h-12 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating your studio...
                </>
              ) : (
                "Create Your First Moodboard"
              )}
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board, i) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-2xl bg-card shadow-card transition-all hover:shadow-card-hover"
              >
                {/* Thumbnail */}
                <Link to={`/canvas?id=${board.id}`} className="block">
                  <div className="relative aspect-video overflow-hidden bg-secondary">
                    {(board as any).canvasImages && (board as any).canvasImages.length > 0 ? (
                      <img
                        src={(board as any).canvasImages[0].url}
                        alt={board.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Grid3X3 className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <Badge
                      className={`absolute top-3 right-3 rounded-2xl text-xs ${
                        board.isPublic
                          ? "bg-emerald-500/90 text-primary-foreground border-0"
                          : "bg-foreground/70 text-primary-foreground border-0"
                      }`}
                    >
                      {board.isPublic ? (
                        <><Globe className="mr-1 h-3 w-3" /> Public</>
                      ) : (
                        <><Lock className="mr-1 h-3 w-3" /> Private</>
                      )}
                    </Badge>
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link to={`/canvas?id=${board.id}`}>
                        <h3 className="font-serif text-lg font-medium text-card-foreground truncate hover:text-primary transition-colors">
                          {board.title}
                        </h3>
                      </Link>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Edited {formatTimeAgo(board.updatedAt)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => handleShare(board)}
                        >
                          <Share2 className="h-4 w-4" /> Share with Client
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => handleDuplicate(board)}
                        >
                          <Copy className="h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(board.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {board.tags && board.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-2xl text-xs font-sans text-muted-foreground border-border"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {board.tags && board.tags.length > 3 && (
                      <Badge
                        variant="outline"
                        className="rounded-2xl text-xs font-sans text-muted-foreground border-border"
                      >
                        +{board.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Delete moodboard?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This moodboard will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-2xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-2xl">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={!!shareBoard} onOpenChange={closeShareDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Share with Client</DialogTitle>
            <DialogDescription>
              Create a password-protected link to share "{shareBoard?.title}" with clients for feedback.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!shareLink ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password Protection (Optional)
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Leave empty for public link"
                      value={sharePassword}
                      onChange={(e) => setSharePassword(e.target.value)}
                      className="h-12 rounded-2xl border-2 bg-secondary pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sharePassword 
                      ? "Clients will need this password to view the board."
                      : "Anyone with the link can view this board."}
                  </p>
                </div>
                
                <Button
                  onClick={generateShareLink}
                  className="w-full h-12 rounded-2xl gradient-gold border-0 text-primary-foreground hover:opacity-90"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Generate Share Link
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Share Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={shareLink}
                      className="h-12 rounded-2xl border-2 bg-secondary flex-1"
                    />
                    <Button
                      onClick={copyShareLink}
                      variant="outline"
                      className="h-12 rounded-2xl px-4"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {sharePassword && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                    <p className="text-sm text-amber-800">
                      <strong>Password:</strong> {sharePassword}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Share this password separately with your client.
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={closeShareDialog}
                  variant="outline"
                  className="w-full h-12 rounded-2xl"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
