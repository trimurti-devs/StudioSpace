import { useState, useEffect, useRef } from "react";
import { Loader2, Palette, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";


interface ColorPaletteProps {
  imageUrl: string;
  colorCount?: number;
  onColorsExtracted?: (colors: string[]) => void;
  onColorCopied?: (color: string) => void;
  showHarmonies?: boolean;
  size?: "sm" | "md" | "lg";
}


interface ColorHarmony {
  name: string;
  colors: string[];
  description: string;
}

const ColorPalette = ({
  imageUrl,
  colorCount = 5,
  onColorsExtracted,
  onColorCopied,
  showHarmonies = false,
  size = "md",
}: ColorPaletteProps) => {

  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);


  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  useEffect(() => {
    const extractColors = async () => {
      if (!imageUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Dynamically import ColorThief (browser-only)
        const ColorThief = (await import("colorthief")).default;
        const colorThief = new ColorThief();

        // Create a new image element
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
          try {
            // Get dominant color and palette
            const palette = colorThief.getPalette(img, colorCount);
            
            // Convert RGB arrays to hex strings
            const hexColors = palette.map((rgb: number[]) => {
              return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
            });

            setColors(hexColors);
            onColorsExtracted?.(hexColors);
            setLoading(false);
          } catch (err) {
            console.error("Color extraction failed:", err);
            setError("Failed to extract colors");
            setLoading(false);
          }
        };

        img.onerror = () => {
          setError("Failed to load image");
          setLoading(false);
        };

        img.src = imageUrl;
      } catch (err) {
        console.error("ColorThief import failed:", err);
        setError("Color analysis unavailable");
        setLoading(false);
      }
    };

    extractColors();
  }, [imageUrl, colorCount, onColorsExtracted]);

  // Generate color harmonies
  const generateHarmonies = (baseColors: string[]): ColorHarmony[] => {
    if (baseColors.length === 0) return [];

    const primary = baseColors[0];
    const rgb = hexToRgb(primary);
    if (!rgb) return [];

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    return [
      {
        name: "Complementary",
        colors: [primary, hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l)],
        description: "Opposite on color wheel, high contrast",
      },
      {
        name: "Analogous",
        colors: [
          hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
          primary,
          hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
        ],
        description: "Adjacent colors, harmonious blend",
      },
      {
        name: "Triadic",
        colors: [
          primary,
          hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
        ],
        description: "Evenly spaced, vibrant balance",
      },
      {
        name: "Split Complementary",
        colors: [
          primary,
          hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
          hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
        ],
        description: "Base + two adjacent to complement",
      },
    ];
  };

  // Helper functions
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      Math.round(
        255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))
      );
    return `#${f(0).toString(16).padStart(2, "0")}${f(8)
      .toString(16)
      .padStart(2, "0")}${f(4).toString(16).padStart(2, "0")}`;
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    onColorCopied?.(color);
    toast({
      title: "Color copied!",
      description: `${color} has been copied to your clipboard.`,
    });
    setTimeout(() => setCopiedColor(null), 2000);
  };



  const harmonies = showHarmonies ? generateHarmonies(colors) : [];

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Analyzing colors...</span>
      </div>
    );
  }

  if (error || colors.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Palette className="h-4 w-4" />
        <span className="text-sm">{error || "No colors found"}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Extracted Palette */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Dominant Colors
        </p>
        <div className="flex flex-wrap gap-2">
          {colors.map((color, idx) => (
            <button
              key={idx}
              onClick={() => copyToClipboard(color)}
              className={`${sizeClasses[size]} rounded-full border-2 border-border shadow-sm hover:scale-110 transition-all cursor-pointer relative group flex items-center justify-center`}
              style={{ backgroundColor: color }}
              title={color}
            >
              <span className="sr-only">{color}</span>
              {copiedColor === color && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-foreground text-background px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {color}
              </span>
            </button>
          ))}

        </div>
      </div>

      {/* Color Harmonies */}
      {showHarmonies && harmonies.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Suggested Harmonies
          </p>
          {harmonies.map((harmony) => (
            <div key={harmony.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{harmony.name}</span>
                <span className="text-xs text-muted-foreground">
                  {harmony.description}
                </span>
              </div>
              <div className="flex gap-1">
                {harmony.colors.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => copyToClipboard(color)}
                    className="h-8 flex-1 rounded-lg border border-border hover:scale-105 transition-all relative group flex items-center justify-center"
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {copiedColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-foreground text-background px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {color}
                    </span>
                  </button>
                ))}

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPalette;
