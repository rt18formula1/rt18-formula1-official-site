"use client";

interface AdminImageCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  date: string | null;
  onDelete: () => void;
  onAssign: () => void;
  onCopyEmbed: () => void;
  type: "news" | "portfolio";
}

export function AdminImageCard({ id, title, imageUrl, date, onDelete, onAssign, onCopyEmbed, type }: AdminImageCardProps) {
  return (
    <div data-item-id={id} className="bg-white border border-black/10 rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
      <div className="aspect-square bg-black/5 relative overflow-hidden flex items-center justify-center text-4xl">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span>{type === "news" ? "📰" : "🎨"}</span>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
          <button
            onClick={(e) => { e.stopPropagation(); onAssign(); }}
            className="w-full py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-gray-100 transition"
          >
            Assign to Album
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCopyEmbed(); }}
            className="w-full py-1.5 bg-white text-black text-xs font-bold rounded hover:bg-gray-100 transition"
          >
            Copy Embed ID
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-full py-1.5 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-gray-500 mb-1">{date?.split("T")[0] || ""}</p>
        <h3 className="font-bold text-xs line-clamp-1" title={title}>
          {title}
        </h3>
      </div>
    </div>
  );
}
