/**
 * Utilities for managing project path history
 */

export interface ProjectHistoryItem {
  path: string;
  lastUsed: number; // timestamp
  name: string; // project name (extracted from path)
}

const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = 'claudia-project-history';

/**
 * Get project name from path
 */
function getProjectName(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'Unknown Project';
}

/**
 * Load project history from localStorage
 */
export function loadProjectHistory(): ProjectHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const items = JSON.parse(stored) as ProjectHistoryItem[];
    // Sort by last used, most recent first
    return items.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch (error) {
    console.error('Failed to load project history:', error);
    return [];
  }
}

/**
 * Save project path to history
 */
export function saveProjectToHistory(path: string): void {
  if (!path || path.trim() === '') return;
  
  try {
    let history = loadProjectHistory();
    
    // Remove existing entry if present
    history = history.filter(item => item.path !== path);
    
    // Add new entry at the beginning
    history.unshift({
      path,
      lastUsed: Date.now(),
      name: getProjectName(path)
    });
    
    // Keep only the most recent items
    history = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save project to history:', error);
  }
}

/**
 * Remove a project from history
 */
export function removeProjectFromHistory(path: string): void {
  try {
    const history = loadProjectHistory();
    const filtered = history.filter(item => item.path !== path);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove project from history:', error);
  }
}

/**
 * Clear all project history
 */
export function clearProjectHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear project history:', error);
  }
}

/**
 * Get the most recently used project path
 */
export function getMostRecentProject(): string | null {
  const history = loadProjectHistory();
  return history.length > 0 ? history[0].path : null;
}