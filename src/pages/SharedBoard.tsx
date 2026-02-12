import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, Grid3X3 } from "lucide-react";
import { formatTimeAgo, type MockBoard } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface ShareData {
  boardId: string;
  password: string | null;
  createdAt: string;
  expiresAt: string | null;
}

const SharedBoard = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [board, setBoard] = useState<MockBoard | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [backgroundStyle, setBackgroundStyle] = useState({});

  useEffect(() => {
    if (!token) {
      setError("Invalid share link");
      setIsLoading(false);
      return;
    }

    // Load share data from localStorage
    const shareDataStr = localStorage.getItem(`share_${token}`);
    if (!shareDataStr) {
      setError("This share link has expired or is invalid");
      setIsLoading(false);
      return;
    }

    try {
      const parsedShareData: ShareData = JSON.parse(shareDataStr);
      
      // Check if expired
      if (parsedShareData.expiresAt && new Date(parsedShareData.expiresAt) < new Date()) {
        setError("This share link has expired");
        setIsLoading(false);
        return;
      }

      setShareData(parsedShareData);

      // Load the board
      const boardData = localStorage.getItem(`board_${parsedShareData.boardId}`);
      if (!boardData) {
        setError("Board not found");
        setIsLoading(false);
        return;
      }

      const parsedBoard = JSON.parse(boardData);
      setBoard({
        ...parsedBoard,
        createdAt: new Date(parsedBoard.createdAt),
        updatedAt: new Date(parsedBoard.updatedAt),
      });

      // Set background style if available
      if (parsedBoard.backgroundStyle) {
        setBackgroundStyle(parsedBoard.backgroundStyle);
      }

      // If no password required, show immediately
      if (!parsedShareData.password) {
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load shared board:", error);
      setError("Failed to load shared board");
      setIsLoading(false);
    }
  }, [token]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (password === shareData?.password) {
      setIsAuthenticated(true);
      toast({
        title: "Access granted",
        description: "You can now view this moodboard.",
      });
    } else {
      setError("Incorrect password");
    }

    setIsVerifying(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 mx-auto">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="mt-6 font-serif text-2xl text-foreground">Access Denied</h1>
            <p className="mt-2 text-muted-foreground">{error || "Unable to access this board"}</p>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="mt-6 rounded-2xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Password protection screen
  if (!isAuthenticated && shareData?.password) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl bg-card p-8 md:p-10 shadow-card-hover border border-border/50">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
                  <Lock className="h-8 w-8 text-amber-600" />
                </div>
              </div>

              {/* Headline */}
              <h1 className="mt-6 text-center font-serif text-3xl font-light text-foreground">
                Private Gallery
              </h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                "{board.title}" is password protected
              </p>

              {/* Form */}
              <form onSubmit={handleVerifyPassword} className="mt-8 space-y-6">
                <div>
                  <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Enter Password
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-2 bg-secondary px-5 pr-12 focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isVerifying || !password}
                  className="h-12 w-full rounded-2xl gradient-dark text-primary-foreground border-0 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Access Gallery"
                  )}
                </Button>
              </form>

              {/* Footer */}
              <p className="mt-8 text-center text-xs text-muted-foreground">
                Shared via Studio Space • Private Client Gallery
              </p>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Board view (authenticated)
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="rounded-2xl text-xs border-amber-300 bg-amber-50 text-amber-700">
              <Lock className="mr-1 h-3 w-3" /> Client Gallery
            </Badge>
          </div>
          <h1 className="font-serif text-4xl font-light text-foreground">{board.title}</h1>
          <p className="mt-1 text-muted-foreground">
            Shared moodboard • Last updated {formatTimeAgo(board.updatedAt)}
          </p>
        </motion.div>

        {/* Board Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card shadow-card border border-border/50 overflow-hidden"
        >
          {/* Canvas Area */}
          <div className="relative overflow-hidden" style={{ height: "400px", ...backgroundStyle }}>
            {(board as any).canvasImages && (board as any).canvasImages.length > 0 ? (
              <div className="relative w-full h-full">
                {(board as any).canvasImages.map((img: any, idx: number) => (
                  <motion.div
                    key={img.id || idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="absolute rounded-xl overflow-hidden shadow-lg border border-border/50 bg-background"
                    style={{
                      left: img.position?.x || 0,
                      top: img.position?.y || 0,
                      width: img.size?.width || 200,
                      height: img.size?.height || 200,
                      transform: `rotate(${img.rotation || 0}deg)`,
                      zIndex: img.zIndex || idx,
                    }}
                  >
                    <img
                      src={img.url}
                      alt={`Moodboard image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Grid3X3 className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                  <p className="mt-4 text-muted-foreground">No images in this moodboard yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Footer */}
          <div className="p-6 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {board.tags && board.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="rounded-2xl text-xs font-sans text-muted-foreground border-border"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              This is a private client gallery shared via Studio Space. 
              Please do not share this link with others.
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SharedBoard;
