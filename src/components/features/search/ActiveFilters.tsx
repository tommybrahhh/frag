import { Note } from '@/types';

interface ActiveFiltersProps {
  selectedNotes: Note[];
  onRemoveNote: (noteId: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilters({ selectedNotes, onRemoveNote, onClearAll }: ActiveFiltersProps) {
  if (selectedNotes.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-stone-100 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-stone-600 uppercase tracking-wider">Your Selection:</span>
        <button
          onClick={onClearAll}
          className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors uppercase tracking-widest"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedNotes.map((note) => (
          <span
            key={note.id}
            className="inline-flex items-center bg-stone-900 text-white text-xs px-4 py-2 rounded-full shadow-sm hover:bg-stone-800 transition-colors"
          >
            {note.name}
            <button
              onClick={() => onRemoveNote(note.id)}
              className="ml-2.5 p-0.5 rounded-full hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
              aria-label={`Remove ${note.name}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
