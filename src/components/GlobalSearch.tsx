import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
  className?: string;
}

const GlobalSearch = ({ className }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { students, faculty } = useAppStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const studentResults = students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery) ||
          s.regNo.toLowerCase().includes(searchQuery) ||
          s.class.toLowerCase().includes(searchQuery)
      )
      .map((s) => ({ ...s, type: 'student' }))
      .slice(0, 5);

    const facultyResults = faculty
      .filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery) ||
          f.department.toLowerCase().includes(searchQuery)
      )
      .map((f) => ({ ...f, type: 'faculty' }))
      .slice(0, 3);

    setResults([...studentResults, ...facultyResults]);
  }, [query, students, faculty]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: any) => {
    if (result.type === 'student') {
      navigate(`/students/${result.id}`);
    } else if (result.type === 'faculty') {
      navigate(`/faculty`);
    }
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className={cn('relative w-full', className ?? 'max-w-md')}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search students, faculty..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 glass"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full glass-card max-h-96 overflow-y-auto z-50 animate-fade-in">
          <div className="p-2 space-y-1">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{result.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.type === 'student'
                        ? `${result.regNo} • ${result.class}`
                        : result.department}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      result.type === 'student'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent/10 text-accent'
                    )}
                  >
                    {result.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
