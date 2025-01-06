import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useNoteStore } from '../stores/noteStore';
import { useTagStore } from '../stores/tagStore';

interface ImportBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BookmarkWithFolder {
  title: string;
  url: string | null;
  folderName: string | null;
}

function generatePastelColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 50 + Math.random() * 20;
  const lightness = 75 + Math.random() * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function ImportBookmarksModal({ isOpen, onClose }: ImportBookmarksModalProps) {
  const { createNote } = useNoteStore();
  const { createTag, addTagToNote } = useTagStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [debug, setDebug] = useState<string>('');

  const extractBookmarksAndFolders = (node: Element, currentFolder: string | null = null): BookmarkWithFolder[] => {
    const bookmarks: BookmarkWithFolder[] = [];
    
    // Handle direct bookmark links
    const links = node.querySelectorAll(':scope > dt > a');
    for (const link of links) {
      bookmarks.push({
        title: link.textContent?.trim() || 'Untitled Bookmark',
        url: link.getAttribute('href'),
        folderName: currentFolder
      });
    }

    // Handle folders and their contents
    const folders = node.querySelectorAll(':scope > dt > h3');
    for (const folder of folders) {
      const folderName = folder.textContent?.trim() || null;
      const dlElement = folder.parentElement?.querySelector(':scope > dl');
      
      if (dlElement) {
        const folderBookmarks = extractBookmarksAndFolders(dlElement, folderName);
        bookmarks.push(...folderBookmarks);
      }
    }

    return bookmarks;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setImportedCount(0);
    setDebug('');

    try {
      const text = await file.text();
      setDebug(prev => prev + '\nParsing HTML file...');
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // Find the main bookmarks list (usually inside a DL tag)
      const mainList = doc.querySelector('dl');
      if (!mainList) {
        throw new Error('No bookmarks list found in the file.');
      }

      // Extract bookmarks with their folder structure
      const bookmarks = extractBookmarksAndFolders(mainList);
      setDebug(prev => prev + `\nFound ${bookmarks.length} bookmarks`);
      
      if (bookmarks.length === 0) {
        throw new Error('No bookmarks found in the file. Make sure you exported your bookmarks as HTML.');
      }

      // First, create all unique folder tags
      const uniqueFolders = new Set(bookmarks.map(b => b.folderName).filter(Boolean));
      const folderTagMap = new Map<string, string>();
      
      setDebug(prev => prev + `\nCreating ${uniqueFolders.size} folder tags...`);
      for (const folderName of uniqueFolders) {
        if (!folderName) continue;
        try {
          const tag = await createTag({
            name: folderName,
            color: generatePastelColor(),
          });
          folderTagMap.set(folderName, tag.id);
          setDebug(prev => prev + `\nCreated tag: ${folderName}`);
        } catch (error) {
          console.error('Error creating tag:', error);
          setDebug(prev => prev + `\nError creating tag ${folderName}: ${error}`);
        }
      }

      // Then create notes and assign tags
      let successCount = 0;
      for (const bookmark of bookmarks) {
        try {
          if (!bookmark.url) {
            setDebug(prev => prev + '\nSkipping bookmark without URL');
            continue;
          }

          setDebug(prev => prev + `\nProcessing: ${bookmark.title}`);

          // Create the note
          const content = `${bookmark.url}`;
          const note = await createNote(bookmark.title, content);
          
          // Assign tag if bookmark is in a folder
          if (bookmark.folderName) {
            const tagId = folderTagMap.get(bookmark.folderName);
            if (tagId) {
              await addTagToNote(note.id, tagId);
              setDebug(prev => prev + `\nAssigned tag "${bookmark.folderName}" to note "${bookmark.title}"`);
            }
          }

          successCount++;
          setImportedCount(successCount);
        } catch (error) {
          console.error('Error importing bookmark:', error);
          setDebug(prev => prev + `\nError with bookmark: ${error}`);
          if (error instanceof Error && error.message === 'User must be authenticated to create notes') {
            setError('You must be signed in to import bookmarks.');
            break;
          }
        }
      }

      if (successCount > 0) {
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error('Failed to import any bookmarks. Check the debug log for details.');
      }
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      setError(error instanceof Error ? error.message : 'Failed to import bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Import Bookmarks</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            {error ? (
              <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-start gap-2">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Import your bookmarks from Chrome, Firefox, or any other browser.
                  Each bookmark will be created as a separate note, and folder names will be converted to tags.
                </p>
                
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Open your browser's bookmarks manager</li>
                  <li>Export your bookmarks as HTML</li>
                  <li>Upload the exported file here</li>
                </ol>
              </>
            )}

            <div className="mt-4">
              <label className="block">
                <span className="sr-only">Choose bookmark file</span>
                <input
                  type="file"
                  accept=".html"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
            </div>

            {debug && (
              <div className="mt-4 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 max-h-40 overflow-y-auto">
                {debug.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {(loading || importedCount > 0) && (
          <div className="p-4 border-t bg-gray-50 flex items-center gap-2">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">
                  {importedCount > 0 
                    ? `Imported ${importedCount} bookmarks...` 
                    : 'Importing bookmarks...'}
                </span>
              </>
            ) : importedCount > 0 ? (
              <span className="text-sm text-green-600">
                Successfully imported {importedCount} bookmarks!
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
} 