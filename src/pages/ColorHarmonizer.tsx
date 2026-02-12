import { useState, useRef, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, ImageIcon, X, Palette, Sparkles, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import ColorPalette from "@/components/ColorPalette";

interface ExtractedColor {
  hex: string;
  rgb: string;
  name?: string;
}

const ColorHarmonizer = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setExtractedColors([]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setExtractedColors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    toast({
      title: "Color copied!",
      description: `${color} copied to clipboard`,
    });
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleColorsExtracted = (colors: string[]) => {
    setExtractedColors(colors);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <Badge variant="outline" className="rounded-2xl mb-4 border-primary/30">
            <Sparkles className="mr-1 h-3 w-3 text-primary" />
            AI-Powered
          </Badge>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Smart Color Harmonizer
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Upload any image to extract its dominant colors and discover harmonious color palettes 
            based on color theory principles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/50 hover:border-primary/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />

              {!uploadedImage ? (
                <div className="space-y-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Drop your image here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse (PNG, JPG, WebP)
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="rounded-2xl"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-auto max-h-[400px] object-contain rounded-xl"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Sample Images */}
            {!uploadedImage && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Try with sample images:</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {["fashion-1.jpg", "fashion-2.jpg", "fashion-3.jpg"].map((img) => (
                    <button
                      key={img}
                      onClick={() => setUploadedImage(`/src/assets/mock/${img}`)}
                      className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-colors"
                    >
                      <img
                        src={`/src/assets/mock/${img}`}
                        alt={img}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {uploadedImage ? (
              <>
                {/* Color Analysis */}
                <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl">Color Analysis</h2>
                  </div>
                  <ColorPalette
                    imageUrl={uploadedImage}
                    colorCount={5}
                    onColorsExtracted={handleColorsExtracted}
                    showHarmonies={true}
                    size="lg"
                  />
                </div>

                {/* Extracted Colors List */}
                {extractedColors.length > 0 && (
                  <div className="rounded-2xl bg-card p-6 shadow-card border border-border/50">
                    <h3 className="font-serif text-lg mb-4">Color Codes</h3>
                    <div className="space-y-2">
                      {extractedColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg border border-border shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <div>
                              <p className="font-mono text-sm font-medium">{color}</p>
                              <p className="text-xs text-muted-foreground">
                                RGB: {hexToRgb(color)}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(color)}
                            className="rounded-xl"
                          >
                            {copiedColor === color ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usage Tips */}
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-amber-800">
                    <strong>💡 Pro Tip:</strong> Click any color to copy its hex code. 
                    Use these colors in your moodboards for perfect aesthetic harmony.
                  </p>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center rounded-2xl bg-secondary/30 border-2 border-dashed border-border p-8">
                <div className="text-center text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Upload an image to see color analysis</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Helper function
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "";
};

export default ColorHarmonizer;
