import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Clock,
  X,
  ChevronDown,
  FolderIcon,
  Home,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  loadProjectHistory,
  saveProjectToHistory,
  removeProjectFromHistory,
  type ProjectHistoryItem
} from "@/lib/project-history";

interface ProjectPathSelectorProps {
  value: string;
  onChange: (path: string) => void;
  onSelectPath: () => void;
  disabled?: boolean;
  className?: string;
}

export const ProjectPathSelector: React.FC<ProjectPathSelectorProps> = ({
  value,
  onChange,
  onSelectPath,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ProjectHistoryItem[]>([]);
  const [filter, setFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history on mount and when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHistory(loadProjectHistory());
      setFilter("");
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Filter history based on search
  const filteredHistory = history.filter(item =>
    item.path.toLowerCase().includes(filter.toLowerCase()) ||
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleSelect = (path: string) => {
    onChange(path);
    saveProjectToHistory(path);
    setIsOpen(false);
  };

  const handleRemove = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeProjectFromHistory(path);
    setHistory(loadProjectHistory());
  };

  const formatPath = (path: string) => {
    // For macOS/Linux, check common home patterns
    if (path.startsWith("/Users/")) {
      const username = path.split("/")[2];
      if (username) {
        return path.replace(`/Users/${username}`, "~");
      }
    }
    
    if (path.startsWith("/home/")) {
      const username = path.split("/")[2];
      if (username) {
        return path.replace(`/home/${username}`, "~");
      }
    }
    
    // For Windows
    if (path.match(/^[A-Z]:\\Users\\/)) {
      const parts = path.split("\\");
      if (parts.length > 2) {
        return path.replace(`${parts[0]}\\Users\\${parts[2]}`, "~");
      }
    }
    
    return path;
  };

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            id="project-path"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/path/to/your/project"
            disabled={disabled}
            className={cn(
              "pr-10",
              isOpen && "rounded-b-none border-b-0"
            )}
            onFocus={() => setIsOpen(true)}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            type="button"
          >
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>
        </div>
        <Button
          onClick={onSelectPath}
          size="icon"
          variant="outline"
          disabled={disabled}
          type="button"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full z-50 mt-px overflow-hidden rounded-b-lg border border-t-0 bg-background shadow-lg"
          >
            {history.length > 0 && (
              <div className="border-b p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search recent projects..."
                    className="h-8 pl-8 text-sm"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto">
              {filteredHistory.length > 0 ? (
                <div className="p-1">
                  {filteredHistory.map((item) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group relative flex items-center gap-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      onClick={() => handleSelect(item.path)}
                    >
                      <FolderIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {formatPath(item.path)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.lastUsed)}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleRemove(e, item.path)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {history.length === 0 ? (
                    <>
                      <Home className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>No recent projects</p>
                      <p className="text-xs mt-1">
                        Projects will appear here after you use them
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p>No matching projects</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};