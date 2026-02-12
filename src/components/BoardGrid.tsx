import { BoardCard } from "@/components/BoardCard";
import { type MockBoard } from "@/lib/mock-data";

interface BoardGridProps {
  boards: MockBoard[];
}

export function BoardGrid({ boards }: BoardGridProps) {
  if (boards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="font-serif text-2xl text-muted-foreground">No moodboards found</p>
        <p className="mt-2 text-sm text-muted-foreground">Try a different tag or check back later</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {boards.map((board, i) => (
          <div key={board.id} className="mb-6 break-inside-avoid">
            <BoardCard board={board} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
