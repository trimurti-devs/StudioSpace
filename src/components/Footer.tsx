export function Footer() {
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="font-serif text-lg gradient-text font-medium">STUDIO SPACE</p>
        <p className="mt-1 text-sm text-muted-foreground italic">The studio, not the stage</p>
        <p className="mt-4 text-xs text-muted-foreground">© {new Date().getFullYear()} Studio Space. All rights reserved.</p>
      </div>
    </footer>
  );
}
