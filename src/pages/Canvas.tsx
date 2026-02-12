import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, ArrowLeft, Save, Share2, Lock, Globe, Upload, X, ImagePlus, Download, Trash2, Move, ZoomIn, ZoomOut, RotateCcw, Check, Palette } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { emailService } from "@/lib/email-service";
import { useAuth } from "@/hooks/useAuth";
import { type MockBoard } from "@/lib/mock-data";
import ColorPalette from "@/components/ColorPalette";



interface CanvasImage {
  id: string;
  url: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  zIndex: number;
}

const Canvas = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const boardId = searchParams.get("id");

  
  const [board, setBoard] = useState<MockBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [selectedImageForColors, setSelectedImageForColors] = useState<string | null>(null);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>("#f8f8f8");
  const [backgroundStyle, setBackgroundStyle] = useState({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent colors from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recent_colors");
    if (saved) {
      setRecentColors(JSON.parse(saved));
    }
    const savedBg = localStorage.getItem(`canvas_bg_${boardId}`);
    if (savedBg) {
      setCanvasBackgroundColor(savedBg);
    }
    const savedTemplate = localStorage.getItem(`canvas_template_${boardId}`);
    if (savedTemplate) {
      applyTemplate(savedTemplate);
    }
  }, [boardId]);



  const canvasRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load board data
  useEffect(() => {
    const loadBoard = async () => {
      if (!boardId) {
        navigate("/dashboard");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const savedBoard = localStorage.getItem(`board_${boardId}`);
      if (savedBoard) {
        const parsed = JSON.parse(savedBoard);
        setBoard(parsed);
        setTitle(parsed.title);
        setTags(parsed.tags || []);
        setImages(parsed.canvasImages || []);
        setLastSaved(new Date(parsed.updatedAt || parsed.createdAt));
      } else {
        const mockBoard: MockBoard = {
          id: boardId,
          title: "Untitled Moodboard",
          username: user?.name || "Anonymous",
          images: [],
          tags: [],
          viewCount: 0,
          createdAt: new Date(),
          isPublic: false,
          updatedAt: new Date(),
        };
        setBoard(mockBoard);
        setTitle(mockBoard.title);
        setTags(mockBoard.tags);
        setLastSaved(new Date());
      }
      
      setLoading(false);
    };

    loadBoard();
  }, [boardId, navigate]);

  // Track unsaved changes
  useEffect(() => {
    if (board) {
      const savedBoard = localStorage.getItem(`board_${boardId}`);
      if (savedBoard) {
        const parsed = JSON.parse(savedBoard);
        const hasChanges = 
          parsed.title !== title ||
          JSON.stringify(parsed.tags) !== JSON.stringify(tags) ||
          JSON.stringify(parsed.canvasImages) !== JSON.stringify(images);
        setHasUnsavedChanges(hasChanges);
      } else {
        setHasUnsavedChanges(images.length > 0 || title !== "Untitled Moodboard" || tags.length > 0);
      }
    }
  }, [title, tags, images, board, boardId]);

  // Auto-save on window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const maxWidth = 250;
          const width = Math.min(maxWidth, img.width);
          const height = width / aspectRatio;
          
          const newImage: CanvasImage = {
            id: crypto.randomUUID(),
            url: e.target?.result as string,
            position: { 
              x: 50 + (index * 30) + Math.random() * 50, 
              y: 50 + (index * 30) + Math.random() * 50 
            },
            size: { width, height },
            rotation: 0,
            zIndex: images.length + index,
          };
          
          setImages((prev) => [...prev, newImage]);
          toast({
            title: "Image added!",
            description: `${file.name} has been added to your moodboard.`,
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleRemoveImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setSelectedImageId(null);
    toast({
      title: "Image removed",
      description: "The image has been removed from your moodboard.",
    });
  };

  const handleImageMouseDown = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const image = images.find((img) => img.id === imageId);
    if (!image) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDraggedImage(imageId);
    setSelectedImageId(imageId);
    setDragOffset({
      x: e.clientX - rect.left - image.position.x,
      y: e.clientY - rect.top - image.position.y,
    });
    
    // Bring to front
    setImages((prev) => {
      const maxZ = Math.max(...prev.map((img) => img.zIndex), 0);
      return prev.map((img) => 
        img.id === imageId ? { ...img, zIndex: maxZ + 1 } : img
      );
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedImage || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    setImages((prev) => 
      prev.map((img) => 
        img.id === draggedImage ? { ...img, position: { x, y } } : img
      )
    );
  }, [draggedImage, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedImage(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas background, not on images
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setSelectedImageId(null);
    }
  }, []);

  const handleResizeImage = (imageId: string, delta: number) => {
    setImages((prev) => 
      prev.map((img) => {
        if (img.id !== imageId) return img;
        const newWidth = Math.max(100, Math.min(500, img.size.width + delta));
        const aspectRatio = img.size.width / img.size.height;
        return {
          ...img,
          size: { 
            width: newWidth, 
            height: newWidth / aspectRatio 
          }
        };
      })
    );
  };

  const handleRotateImage = (imageId: string, degrees: number) => {
    setImages((prev) => 
      prev.map((img) => 
        img.id === imageId ? { ...img, rotation: img.rotation + degrees } : img
      )
    );
  };

  const handleSave = async () => {
    if (!board) return;
    
    setIsSaving(true);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const updatedBoard = {
        ...board,
        title,
        tags,
        updatedAt: new Date(),
        canvasImages: images,
        backgroundStyle
      };

      
      localStorage.setItem(`board_${board.id}`, JSON.stringify(updatedBoard));
      setBoard(updatedBoard);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Send email notification if enabled
      if (user) {
        await emailService.sendBoardCreatedEmail(user.email, user.name, title);
      }
      
      toast({
        title: "Saved!",
        description: "Your moodboard has been saved successfully.",
      });

    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save moodboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!board) return;
    
    const newIsPublic = !board.isPublic;
    
    const updatedBoard = { 
      ...board, 
      isPublic: newIsPublic,
      updatedAt: new Date()
    };
    
    // Save to localStorage immediately
    localStorage.setItem(`board_${board.id}`, JSON.stringify(updatedBoard));
    
    setBoard(updatedBoard);
    setHasUnsavedChanges(false);
    
    toast({
      title: newIsPublic ? "Board is now public" : "Board is now private",
      description: newIsPublic 
        ? "Anyone can view this moodboard" 
        : "Only you can view this moodboard",
    });
  };


  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/canvas?id=${boardId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard.",
    });
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const exportAsJSON = () => {
    if (!board) return;
    
    const exportData = {
      ...board,
      title,
      tags,
      canvasImages: images,
      exportedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_")}_moodboard.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported as JSON!",
      description: "Your moodboard has been exported as a JSON file.",
    });
    setExportDialogOpen(false);
  };

  const exportAsImage = async () => {
    if (!canvasRef.current || images.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Add some images to your moodboard first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Create a temporary canvas to render the moodboard
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Set canvas size
      canvas.width = 1200;
      canvas.height = 800;
      
      // Fill background
      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw title
      ctx.font = "bold 24px serif";
      ctx.fillStyle = "#333";
      ctx.fillText(title, 40, 50);
      
      // Draw images
      for (const img of images) {
        const imageElement = new Image();
        imageElement.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve;
          imageElement.onerror = reject;
          imageElement.src = img.url;
        });
        
        ctx.save();
        ctx.translate(img.position.x + img.size.width / 2, img.position.y + img.size.height / 2);
        ctx.rotate((img.rotation * Math.PI) / 180);
        ctx.drawImage(
          imageElement,
          -img.size.width / 2,
          -img.size.height / 2,
          img.size.width,
          img.size.height
        );
        ctx.restore();
      }
      
      // Export
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${title.replace(/\s+/g, "_")}_moodboard.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exported as image!",
        description: "Your moodboard has been exported as a PNG image.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export moodboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportDialogOpen(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const formattedTag = newTag.startsWith("#") ? newTag : `#${newTag}`;
    if (!tags.includes(formattedTag)) {
      setTags([...tags, formattedTag]);
      setNewTag("");
      toast({
        title: "Tag added",
        description: `${formattedTag} has been added to your moodboard.`,
      });
    }
  };

  const handleColorCopied = (color: string) => {
    // Add to recent colors
    setRecentColors((prev) => {
      const updated = [color, ...prev.filter((c) => c !== color)].slice(0, 10);
      localStorage.setItem("recent_colors", JSON.stringify(updated));
      return updated;
    });
  };

  const copyRecentColor = (color: string) => {
    navigator.clipboard.writeText(color);
    toast({
      title: "Color copied!",
      description: `${color} copied to clipboard`,
    });
  };

  const clearRecentColors = () => {
    setRecentColors([]);
    localStorage.removeItem("recent_colors");
    toast({
      title: "Cleared",
      description: "Recent colors cleared",
    });
  };

  const applyCanvasBackground = (color: string) => {
    setCanvasBackgroundColor(color);
    setBackgroundStyle({ backgroundColor: color });
    localStorage.setItem(`canvas_bg_${boardId}`, color);
    localStorage.setItem(`canvas_template_${boardId}`, 'blank');
    toast({
      title: "Background applied!",
      description: `Canvas background set to ${color}`,
    });
  };

  const addColorSwatch = (color: string) => {
    const newSwatch: CanvasImage = {
      id: crypto.randomUUID(),
      url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${color}"/></svg>`)}`,
      position: { 
        x: 50 + Math.random() * 100, 
        y: 50 + Math.random() * 100 
      },
      size: { width: 100, height: 100 },
      rotation: 0,
      zIndex: images.length + 1,
    };
    
    setImages((prev) => [...prev, newSwatch]);
    toast({
      title: "Color swatch added!",
      description: `Added ${color} to your canvas`,
    });
  };

  const exportColorPalette = () => {
    if (recentColors.length === 0) {
      toast({
        title: "No colors to export",
        description: "Copy some colors first",
        variant: "destructive",
      });
      return;
    }
    
    const paletteData = {
      name: `${title} - Color Palette`,
      colors: recentColors,
      createdAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(paletteData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_")}_palette.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Palette exported!",
      description: "Color palette saved as JSON",
    });
  };



  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    toast({
      title: "Tag removed",
      description: `${tagToRemove} has been removed.`,
    });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  const clearCanvas = () => {
    if (images.length === 0) return;
    if (confirm("Are you sure you want to remove all images from the canvas?")) {
      setImages([]);
      setSelectedImageId(null);
      toast({
        title: "Canvas cleared",
        description: "All images have been removed.",
      });
    }
  };

  const applyTemplate = (type: string) => {
    let style = {};
    switch(type) {
      case 'blank':
        style = { backgroundColor: canvasBackgroundColor };
        break;
      case 'grid':
        style = {
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundColor: canvasBackgroundColor
        };
        break;
      case 'dotted':
        style = {
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundColor: canvasBackgroundColor
        };
        break;
      case 'gradient':
        style = {
          background: 'linear-gradient(45deg, #ff9a9e, #fecfef)',
        };
        break;
      case 'colorScheme1':
        style = {
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
        };
        break;
    }
    setBackgroundStyle(style);
    localStorage.setItem(`canvas_template_${boardId}`, type);
  };

  const arrangeImages = (type: string) => {
    if (type === 'grid') {
      const cols = Math.ceil(Math.sqrt(images.length));
      const rows = Math.ceil(images.length / cols);
      const spacingX = 1200 / cols;
      const spacingY = 800 / rows;
      setImages(prev => prev.map((img, index) => ({
        ...img,
        position: {
          x: (index % cols) * spacingX + 50,
          y: Math.floor(index / cols) * spacingY + 50
        }
      })));
    }
  };

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

  if (!board) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar variant="dashboard" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Board not found</p>
            <Button 
              onClick={() => navigate("/dashboard")} 
              className="mt-4"
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="dashboard" />

      <main className="flex-1 container mx-auto px-4 py-6 pt-24">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-2xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                className="text-xl font-serif font-light border-0 bg-transparent focus-visible:ring-0 px-0 h-auto w-[300px]"
                placeholder="Untitled Moodboard"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                {board.isPublic ? "Public" : "Private"} • Created {new Date(board.createdAt).toLocaleDateString()}
                {hasUnsavedChanges && (
                  <span className="text-amber-500 flex items-center gap-1">
                    • Unsaved changes
                  </span>
                )}
                {lastSaved && !hasUnsavedChanges && (
                  <span className="text-emerald-500 flex items-center gap-1">
                    • <Check className="h-3 w-3" /> Saved
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePrivacy}
              className="rounded-2xl"
            >
              {board.isPublic ? (
                <><Globe className="mr-2 h-4 w-4" /> Public</>
              ) : (
                <><Lock className="mr-2 h-4 w-4" /> Private</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="rounded-2xl"
            >
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="rounded-2xl"
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorPanel(!showColorPanel)}
              className={`rounded-2xl ${showColorPanel ? "bg-primary/10 border-primary/30" : ""}`}
            >
              <Palette className="mr-2 h-4 w-4" /> Colors
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="rounded-2xl gradient-gold border-0 text-primary-foreground hover:opacity-90"
            >
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save</>
              )}
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="default"
              className="rounded-2xl"
            >
              <Upload className="mr-2 h-4 w-4" /> Upload Images
            </Button>
            <Button
              onClick={clearCanvas}
              variant="outline"
              disabled={images.length === 0}
              className="rounded-2xl"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-2xl">
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-2xl">
                <DropdownMenuItem onClick={() => applyTemplate('blank')}>Blank Canvas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTemplate('grid')}>Grid Background</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTemplate('dotted')}>Dotted Background</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTemplate('gradient')}>Gradient Background</DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTemplate('colorScheme1')}>Color Scheme 1</DropdownMenuItem>
                <DropdownMenuItem onClick={() => arrangeImages('grid')}>Arrange in Grid</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground ml-2">
              or drag & drop images here
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="rounded-2xl"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="rounded-2xl"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="rounded-2xl"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected Image Controls */}
        <AnimatePresence>
          {selectedImageId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-secondary rounded-2xl flex items-center gap-2 flex-wrap"
            >
              <span className="text-sm font-medium">Selected Image:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResizeImage(selectedImageId, 20)}
                className="rounded-xl"
              >
                +
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResizeImage(selectedImageId, -20)}
                className="rounded-xl"
              >
                -
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotateImage(selectedImageId, -15)}
                className="rounded-xl"
              >
                ↺
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRotateImage(selectedImageId, 15)}
                className="rounded-xl"
              >
                ↻
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveImage(selectedImageId)}
                className="rounded-xl ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Canvas and Color Panel Area */}
        <div className="flex gap-4">
          <div className="flex-1">
            {/* Canvas Area */}
            <div className="relative overflow-auto rounded-2xl border-2 border-dashed border-border" style={{ height: "600px", ...backgroundStyle }}>

              <motion.div
                ref={canvasRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
                className={`canvas-background relative w-full h-full ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : ""
                } transition-colors cursor-crosshair`}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  minHeight: "100%",
                  width: "100%"
                }}
              >


              {images.length === 0 ? (
                <div className="canvas-background absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center pointer-events-auto">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-serif text-xl text-foreground">Your Canvas</h3>
                    <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                      Start building your moodboard by uploading images or dragging and dropping them here.
                    </p>
                    <div className="mt-6 flex gap-2 justify-center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        variant="default"
                      >
                        <Upload className="mr-2 h-4 w-4" /> Upload Images
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full" style={{ minHeight: "600px" }}>

                  {images.map((image) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: selectedImageId === image.id ? 1.02 : 1,
                        rotate: image.rotation
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleImageMouseDown(e, image.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute cursor-move select-none ${
                        selectedImageId === image.id ? "ring-2 ring-primary ring-offset-2" : ""
                      }`}
                      style={{
                        left: image.position.x,
                        top: image.position.y,
                        width: image.size.width,
                        height: image.size.height,
                        zIndex: image.zIndex,
                      }}
                    >
                      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-border bg-background">
                        <img
                          src={image.url}
                          alt="Moodboard item"
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                        />
                        {selectedImageId === image.id && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-md">
                            <Move className="h-3 w-3 inline mr-1" /> Drag to move
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {showColorPanel && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-80"
              >
                <div className="rounded-2xl bg-card p-4 shadow-card border border-border/50 max-h-[600px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif text-lg flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Color Palette
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedImageForColors(null)}
                        className={`rounded-xl ${!selectedImageForColors ? "bg-secondary" : ""}`}
                      >
                        All Images
                      </Button>
                      {selectedImageId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedImageForColors(selectedImageId)}
                          className={`rounded-xl ${selectedImageForColors === selectedImageId ? "bg-secondary" : ""}`}
                        >
                          Selected Image
                        </Button>
                      )}
                    </div>
                  </div>

                  {images.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {(selectedImageForColors
                        ? images.filter(img => img.id === selectedImageForColors)
                        : images.slice(0, 2)
                      ).map((image) => (
                        <div key={image.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={image.url}
                              alt="Thumbnail"
                              className="w-8 h-8 rounded object-cover"
                            />
                            <span className="text-xs text-muted-foreground">
                              {selectedImageForColors ? "Selected image colors" : "Image colors"}
                            </span>
                          </div>
                          <ColorPalette
                            imageUrl={image.url}
                            colorCount={5}
                            size="sm"
                            showHarmonies={true}
                            onColorCopied={handleColorCopied}
                          />

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mx-auto mb-4">
                        <Palette className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        No images to analyze yet
                      </p>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Upload images to extract color palettes and get harmony suggestions.
                        Click the <strong>Upload Images</strong> button or drag & drop images onto the canvas.
                      </p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                        className="mt-4 rounded-xl"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
                      </Button>
                    </div>
                  )}


                  {/* Recent Colors Section */}
                  {recentColors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Recent Colors ({recentColors.length})
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={exportColorPalette}
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                            title="Export palette as JSON"
                          >
                            Export
                          </button>
                          <button
                            onClick={clearRecentColors}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentColors.map((color, idx) => (
                          <div key={idx} className="relative group">
                            <button
                              onClick={() => copyRecentColor(color)}
                              className="w-10 h-10 rounded-full border-2 border-border shadow-sm hover:scale-110 transition-all relative"
                              style={{ backgroundColor: color }}
                              title={color}
                            >
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-foreground text-background px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {color}
                              </span>
                            </button>
                            {/* Action buttons on hover */}
                            <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applyCanvasBackground(color);
                                }}
                                className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center shadow-sm"
                                title="Apply as background"
                              >
                                BG
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addColorSwatch(color);
                                }}
                                className="w-5 h-5 rounded-full bg-secondary text-foreground text-[10px] flex items-center justify-center shadow-sm"
                                title="Add to canvas"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={() => applyCanvasBackground(recentColors[0])}
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs h-8"
                        >
                          Apply Last Color as Background
                        </Button>
                        <Button
                          onClick={() => addColorSwatch(recentColors[0])}
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs h-8"
                        >
                          Add Last Color to Canvas
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Hover color for quick actions • Click to copy hex code
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-3">
                    💡 Click any color above to copy its hex code and save it to recent colors.
                  </p>


                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Image Count & Info */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-muted-foreground">
            {images.length} {images.length === 1 ? "image" : "images"} • 
            {lastSaved ? ` Last saved: ${lastSaved.toLocaleTimeString()}` : " Not saved yet"}
          </div>
          <div className="text-sm text-muted-foreground">
            Tip: Click an image to select it, then drag to reposition
          </div>
        </div>

        {/* Tags Section */}
        <div className="mt-6 p-4 bg-secondary/50 rounded-2xl">
          <h4 className="text-sm font-medium text-foreground mb-3">Tags</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags yet. Add tags to organize your moodboard.</p>
            ) : (
              tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="rounded-2xl cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} <X className="h-3 w-3 ml-1 inline" />
                </Badge>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="Add a tag (e.g., #vintage)"
              className="rounded-2xl h-9 max-w-[200px]"
            />
            <Button 
              onClick={handleAddTag}
              variant="outline" 
              size="sm" 
              className="rounded-2xl"
              disabled={!newTag.trim()}
            >
              Add Tag
            </Button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Share Moodboard</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with others to let them view your moodboard:
            </p>
            <div className="flex gap-2">
              <Input 
                value={`${window.location.origin}/canvas?id=${boardId}`}
                readOnly
                className="rounded-2xl"
              />
              <Button onClick={copyShareLink} className="rounded-2xl">
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)} variant="outline" className="rounded-2xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Export Moodboard</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how you want to export your moodboard:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={exportAsJSON}
                variant="outline"
                className="rounded-2xl h-auto py-6 flex flex-col items-center gap-2"
              >
                <Download className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Export as JSON</div>
                  <div className="text-xs text-muted-foreground">Save data for later editing</div>
                </div>
              </Button>
              <Button
                onClick={exportAsImage}
                disabled={isExporting || images.length === 0}
                className="rounded-2xl h-auto py-6 flex flex-col items-center gap-2 gradient-gold border-0 text-primary-foreground"
              >
                {isExporting ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <ImagePlus className="h-8 w-8" />
                )}
                <div className="text-center">
                  <div className="font-medium">Export as Image</div>
                  <div className="text-xs text-primary-foreground/80">Download as PNG</div>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setExportDialogOpen(false)} variant="outline" className="rounded-2xl">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Canvas;
