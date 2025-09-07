'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import * as authorChapterService from '../_services/authorChapterService';
import { useDropzone } from 'react-dropzone';
import { useEffect } from 'react';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import supabase from '@/lib/supabaseClient';

interface ChapterBulkUploadProps {
  novelId: string;
  userId: string;
  onUploadComplete: () => void;
  volumeId?: string;
}

interface FileToProcess {
  name: string;
  content: ArrayBuffer;
}

interface ProcessedContent {
  title: string | null;
  content: string;
  chapterNumber: number | null;
  partNumber: number | null;
}

export default function ChapterBulkUpload({ novelId, userId, onUploadComplete, volumeId }: ChapterBulkUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<FileToProcess[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [bulkPublishDate, setBulkPublishDate] = useState<string>('');
  const [useAutoRelease, setUseAutoRelease] = useState(true);
  const [chaptersPerDay, setChaptersPerDay] = useState<number>(1);
  const [intervalHours, setIntervalHours] = useState<number>(1);
  const [defaultAuthorThoughts, setDefaultAuthorThoughts] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('defaultAuthorThoughts');
      if (saved) {
        setDefaultAuthorThoughts(saved);
      }
    }
  }, []);

  const processZipFile = async (file: File): Promise<FileToProcess[]> => {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    const processableFiles: FileToProcess[] = [];

    for (const [path, zipEntry] of Object.entries(zipContent.files)) {
      if (!zipEntry.dir && (path.toLowerCase().endsWith('.docx') || path.toLowerCase().endsWith('.txt') || path.toLowerCase().endsWith('.md'))) {
        const content = await zipEntry.async('arraybuffer');
        processableFiles.push({
          name: path.split('/').pop() || path,
          content
        });
      }
    }

    if (processableFiles.length === 0) {
      toast.error('No .docx, .txt, or .md files found in the zip archive');
    }

    return processableFiles;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: FileToProcess[] = [];
    
    for (const file of acceptedFiles) {
      if (file.name.endsWith('.docx') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const arrayBuffer = await file.arrayBuffer();
        newFiles.push({
          name: file.name,
          content: arrayBuffer
        });
      } else if (file.name.endsWith('.zip')) {
        const zipFiles = await processZipFile(file);
        newFiles.push(...zipFiles);
      } else {
        toast.error('Only .docx, .txt, .md, and .zip files are allowed');
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/zip': ['.zip']
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileContent = async (file: FileToProcess): Promise<ProcessedContent> => {
    if (file.name.endsWith('.txt')) {
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(file.content);
      const lines = content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l !== '' && l !== '""');
      return extractChapterInfo(lines, file.name);
    } else if (file.name.endsWith('.md')) {
      // For markdown files, filter empty lines and use extractChapterInfo for paragraph separation
      const decoder = new TextDecoder('utf-8');
      const contentStr = decoder.decode(file.content);
      const lines = contentStr
        .split('\n')
        .map(l => l.trim())
        .filter(l => l !== '' && l !== '""');
      return extractChapterInfo(lines, file.name);
    } else {
      // For docx files, extract all content
      const result = await mammoth.extractRawText({ arrayBuffer: file.content });
      const lines = result.value
        .split('\n')
        .map(l => l.trim())
        .filter(l => l !== '' && l !== '""');
      return extractChapterInfo(lines, file.name);
    }
  };

  const extractChapterInfo = (lines: string[], filename: string): ProcessedContent => {
    if (lines.length === 0) {
      return { content: '', title: null, chapterNumber: null, partNumber: null };
    }

    const firstLine = lines[0].trim();
    
    // Try to match patterns like:
    // "Chapter 1.1: Title" or "Chapter 1 Part 1: Title" or "Chapter 1-1: Title"
    const chapterMatch = firstLine.match(/^(?:chapter|ch\.?)\s*(\d+)(?:[\s-.](\d+)|[\s-]part[\s-](\d+))?(?:[\s:-]+(.+))?/i);
    
    if (chapterMatch) {
      const mainChapter = parseInt(chapterMatch[1]);
      // Check for decimal notation (1.1) or "part" notation (Part 1)
      const partNumber = chapterMatch[2] 
        ? parseInt(chapterMatch[2]) 
        : chapterMatch[3] 
          ? parseInt(chapterMatch[3])
          : null;
      const title = chapterMatch[4]?.trim() || null;
      const content = lines.slice(1).join('\n\n');
      
      return {
        chapterNumber: mainChapter,
        title,
        content,
        partNumber
      };
    }
    
    // If no chapter pattern found in content, try to extract from filename
    // Match patterns like: 
    // "chapter 10 - title.md"
    // "chapter 10: title.md"
    // "chapter 10_title.md"
    // "chapter-10-title.md"
    // "ch10 - title.md"
    const filenameMatch = filename.match(/^(?:chapter|ch\.?)[-\s]*(\d+)(?:[-:\s_]+(.+?))?\.(?:md|txt|docx)$/i);
    if (filenameMatch) {
      return {
        chapterNumber: parseInt(filenameMatch[1]),
        title: filenameMatch[2]?.trim() || null,
        content: lines.join('\n\n'),
        partNumber: null
      };
    }
    
    // Direct number match with optional title (e.g., "10 - title.md", "10_title.md")
    const numberMatch = filename.match(/^(\d+)(?:[-:\s_]+(.+?))?\.(?:md|txt|docx)$/i);
    if (numberMatch) {
      return {
        chapterNumber: parseInt(numberMatch[1]),
        title: numberMatch[2]?.trim() || null,
        content: lines.join('\n\n'),
        partNumber: null
      };
    }
    
    // If no chapter pattern found, return content as is
    return {
      content: lines.join('\n\n'),
      title: null,
      chapterNumber: null,
      partNumber: null
    };
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);

    try {
      // First extract all file contents
      const filesWithContent = await Promise.all(
        files.map(async (file) => ({
          file,
          content: await getFileContent(file)
        }))
      );

      // Then sort based on chapter numbers and part numbers
      const sortedFiles = filesWithContent.sort((a, b) => {
        // If both files have chapter numbers in content, use those
        if (a.content.chapterNumber !== null && b.content.chapterNumber !== null) {
          // First compare chapter numbers
          if (a.content.chapterNumber !== b.content.chapterNumber) {
            return a.content.chapterNumber - b.content.chapterNumber;
          }
          // If chapter numbers are the same, compare part numbers
          const aPartNum = a.content.partNumber || 0;
          const bPartNum = b.content.partNumber || 0;
          return aPartNum - bPartNum;
        }
        
        // Fall back to filename sorting if needed
        const aMatch = a.file.name.match(/^chapter[\s-]?(\d+)(?:\.(\d+))?/i);
        const bMatch = b.file.name.match(/^chapter[\s-]?(\d+)(?:\.(\d+))?/i);
        const aNum = aMatch ? parseInt(aMatch[1]) : 0;
        const bNum = bMatch ? parseInt(bMatch[1]) : 0;
        
        // If chapter numbers are different, sort by them
        if (aNum !== bNum) return aNum - bNum;
        
        // If chapter numbers are the same, sort by part numbers
        const aPartNum = aMatch?.[2] ? parseInt(aMatch[2]) : 0;
        const bPartNum = bMatch?.[2] ? parseInt(bMatch[2]) : 0;
        return aPartNum - bPartNum;
      });

      // Get the latest published chapter's date before we start uploading
      let lastPublishDate: Date | undefined;
      if (useAutoRelease) {
        try {
          const { data: latestChapter } = await supabase
            .from('chapters')
            .select('publish_at')
            .eq('novel_id', novelId)
            .order('publish_at', { ascending: false })
            .limit(1)
            .single();

          if (latestChapter?.publish_at) {
            const candidateDate = new Date(latestChapter.publish_at);
            // Only consider this date if it is in the future (i.e., an advanced chapter).
            if (candidateDate > new Date()) {
              lastPublishDate = candidateDate;
            }
          }
        } catch (error) {
          console.debug('No previous chapters found:', error);
        }
      }

      // Fetch novel settings once (used for coin defaults when we manually schedule)
      let novelSettings: { fixed_price_enabled: boolean; fixed_price_amount: number } | null = null;
      if (useAutoRelease) {
        const { data: novel } = await supabase
          .from('novels')
          .select('fixed_price_enabled, fixed_price_amount')
          .eq('id', novelId)
          .single();
        novelSettings = novel || null;
      }

      // Helper to get default coins
      const getDefaultCoins = (): number => {
        if (novelSettings?.fixed_price_enabled) return novelSettings.fixed_price_amount ?? 0;
        let defaultCoins = 1;
        if (typeof window !== 'undefined') {
          const savedCoins = localStorage.getItem('defaultChapterCoins');
          if (savedCoins) {
            const parsed = parseInt(savedCoins);
            if (!isNaN(parsed) && parsed > 0) defaultCoins = parsed;
          }
        }
        return defaultCoins;
      };

      // Time spacing between chapters within the same day (in milliseconds)
      const spacingMs = chaptersPerDay > 1 ? intervalHours * 60 * 60 * 1000 : 0;

      // Track the base date generated by applyAutoReleaseSchedule for the current day
      // If there are no advanced chapters (i.e., lastPublishDate is undefined),
      // we want scheduling to start relative to "now", so we leave currentDayBaseDate undefined.
      let currentDayBaseDate: Date | undefined = lastPublishDate;

      // Loop with index so we can know position within the day group
      for (let idx = 0; idx < sortedFiles.length; idx++) {
        const { file, content: { content, title: contentTitle, chapterNumber, partNumber } } = sortedFiles[idx];
        try {
          // If we couldn't extract chapter number from content, try filename
          let finalChapterNumber = chapterNumber;
          let finalPartNumber = partNumber;
          
          if (finalChapterNumber === null) {
            const titleMatch = file.name.match(/^chapter[\s-]?(\d+)(?:[-\s.](\d+))?\.(docx|txt)$/i);
            
            if (!titleMatch) {
              throw new Error(`Could not determine chapter number for ${file.name}`);
            }
            finalChapterNumber = parseInt(titleMatch[1]);
            finalPartNumber = titleMatch[2] ? parseInt(titleMatch[2]) : null;
          }

          let finalTitle = '';
          const filenameTitleMatch = file.name.match(/^chapter[\s-]?(\d+)(?:[-\s.](\d+))?(?:[-:_\s]+(.+?))?\.(docx|txt)$/i);
          if (filenameTitleMatch && filenameTitleMatch[3]) {
            finalTitle = filenameTitleMatch[3].trim();
          } else if (contentTitle) {
            finalTitle = contentTitle;
          }

          // Create the chapter with publish_at based on settings and include volumeId if provided
          // If auto-release is OFF and no bulkPublishDate set, publish immediately (now in local time → UTC)
          const immediateNowIso = (() => {
            if (useAutoRelease) return null;
            if (bulkPublishDate) return bulkPublishDate;
            const now = new Date();
            // store as UTC ISO so server comparisons work
            return new Date(now.getTime()).toISOString();
          })();

          const chapterId = await authorChapterService.createChapter(novelId, userId, {
            chapter_number: finalChapterNumber,
            part_number: finalPartNumber,
            title: finalTitle,
            content,
            publish_at: immediateNowIso,
            coins: useAutoRelease ? getDefaultCoins() : 0,
            author_thoughts: defaultAuthorThoughts || undefined,
            volume_id: volumeId
          });

          // Only apply auto-release schedule if enabled
          if (useAutoRelease) {
            const positionInDay = idx % chaptersPerDay;

            // For the first chapter of each day group, call applyAutoReleaseSchedule to get the base date
            if (positionInDay === 0) {
              const baseDate = await authorChapterService.applyAutoReleaseSchedule(
                novelId,
                userId,
                chapterId,
                currentDayBaseDate
              );

              if (baseDate) {
                currentDayBaseDate = baseDate;
                lastPublishDate = baseDate;
              }
            } else if (currentDayBaseDate) {
              // Subsequent chapters on the same day are spaced evenly using spacingMs
              const scheduledDate = new Date(currentDayBaseDate.getTime() + positionInDay * spacingMs);

              // Convert to UTC ISO string
              const publishISO = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000).toISOString();

              // Update chapter publish time (and coins, if needed)
              const updateData: { publish_at: string; coins?: number } = {
                publish_at: publishISO
              };

              if (novelSettings?.fixed_price_enabled) {
                updateData.coins = novelSettings.fixed_price_amount;
              } else {
                updateData.coins = getDefaultCoins();
              }

              await supabase
                .from('chapters')
                .update(updateData)
                .eq('id', chapterId);
            }
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          
          // Show error message and abort the entire upload
          if (errorMessage.includes('already exists')) {
            toast.error(`Upload aborted: Chapter ${file.name} already exists`);
          } else {
            toast.error(`Upload aborted: Failed to upload ${file.name} - ${errorMessage}`);
          }
          
          // Exit the function, effectively aborting the upload
          return;
        }
      }

      toast.success('All chapters uploaded successfully!');
      setFiles([]);
      onUploadComplete();
      setIsOpen(false);

    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Failed to complete bulk upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={volumeId ? (
          "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 rounded transition-colors"
        ) : (
          "inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        )}
      >
        <Icon icon="mdi:file-upload" className={volumeId ? "w-3.5 h-3.5" : "w-4 h-4"} />
        {volumeId ? 'Upload to Volume' : 'Upload'}
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => !isUploading && setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="space-y-3 p-4 border border-primary rounded-lg bg-background shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">Upload Chapters</h3>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowHelp(true)}
                      onMouseLeave={() => setShowHelp(false)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-full transition-colors"
                      aria-label="File format help"
                    >
                      <Icon icon="mdi:help-circle-outline" className="w-4 h-4" />
                    </button>
                    {showHelp && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-3 text-xs bg-background text-foreground rounded-lg shadow-lg border border-border z-50">
                        <h4 className="font-medium mb-1">File Format Requirements:</h4>
                        <ul className="space-y-2 list-disc ml-4">
                          <li>
                            <span className="block mb-1">Supported formats:</span>
                            <div className="flex flex-wrap gap-1">
                              <span className="font-mono text-[10px] bg-accent px-1.5 rounded">.md</span>
                              <span className="font-mono text-[10px] bg-accent px-1.5 rounded">.txt</span>
                              <span className="font-mono text-[10px] bg-accent px-1.5 rounded">.docx</span>
                              <span className="font-mono text-[10px] bg-accent px-1.5 rounded">.zip</span>
                            </div>
                          </li>
                          <li>
                            <span className="block mb-1">Naming pattern:</span>
                            <code className="font-mono text-[10px] bg-accent px-1.5 py-0.5 rounded block">
                              chapter[X][-_: ][title]
                            </code>
                            <span className="text-muted-foreground block mt-1">
                              Where X = chapter number, title is optional
                            </span>
                          </li>
                          <li>
                            <span className="block mb-1">Examples:</span>
                            <div className="space-y-0.5 font-mono text-[10px]">
                              <span className="block">chapter10.md</span>
                              <span className="block">chapter 10 - epic battle.md</span>
                              <span className="block">10_the final fight.md</span>
                            </div>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{files.length} file(s)</span>
                  <button
                    onClick={() => !isUploading && setIsOpen(false)}
                    className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                    disabled={isUploading}
                  >
                    <Icon icon="mdi:close" className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
              </div>

              {/* Release Schedule Options */}
              <div className="space-y-3 p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Release Schedule</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Auto Release</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAutoRelease}
                        onChange={(e) => setUseAutoRelease(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Enable auto release scheduling"
                        title="Enable auto release scheduling"
                      />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>

                {!useAutoRelease && (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Set Future Release Date</label>
                    <input
                      type="datetime-local"
                      value={bulkPublishDate}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => setBulkPublishDate(e.target.value)}
                      className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Set future release date and time for all chapters"
                      title="Set future release date and time for all chapters"
                    />
                    <p className="text-xs text-muted-foreground">
                      All chapters will be released at this date and time
                    </p>
                  </div>
                )}

                {useAutoRelease && (
                  <div className="space-y-2">
                    <div className="flex items-end gap-3">
                      {/* Chapters per Day */}
                      <div className="flex-1">
                        <label className="block text-xs text-muted-foreground mb-1">Chapters per Day</label>
                        <input
                          type="number"
                          min={1}
                          value={chaptersPerDay}
                          onChange={(e) => {
                            const value = Math.max(1, Number(e.target.value));
                            setChaptersPerDay(value);
                            const maxInterval = Math.floor(24 / value) || 1;
                            setIntervalHours(prev => Math.min(prev, maxInterval));
                          }}
                          className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          aria-label="Number of chapters to publish each day"
                          title="Number of chapters to publish each day"
                        />
                      </div>

                      {/* Interval Hours */}
                      {chaptersPerDay > 1 && (
                        <div className="flex-1">
                          <label className="block text-xs text-muted-foreground mb-1">Interval (hours)</label>
                          <input
                            type="number"
                            min={1}
                            max={Math.floor(24 / chaptersPerDay) || 1}
                            value={intervalHours}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              const maxAllowed = Math.floor(24 / chaptersPerDay) || 1;
                              const value = Math.min(Math.max(1, raw), maxAllowed);
                              setIntervalHours(value);
                            }}
                            className="w-full p-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Hours between chapters"
                            title="Hours between chapters"
                          />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">Auto-release will split uploads based on the above settings.</p>
                    {chaptersPerDay > 1 && (
                      <p className="text-xs text-muted-foreground">Maximum interval allowed: {Math.floor(24 / chaptersPerDay)}h</p>
                    )}
                  </div>
                )}
              </div>

              <div {...getRootProps()} className={`
                flex items-center justify-center h-20 px-4 
                border-2 border-dashed rounded-md cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'}
              `}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-1">
                  <Icon 
                    icon={isDragActive ? "mdi:folder-open" : "mdi:file-upload"} 
                    className="w-6 h-6 text-muted-foreground" 
                  />
                  <span className="text-xs text-muted-foreground">
                    {isDragActive ? 'Drop files here' : 'Drop .docx, .txt, .md files or .zip archive'}
                  </span>
                </div>
              </div>

              {files.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between text-xs p-1.5 bg-accent rounded">
                        <div className="flex items-center gap-1.5">
                          <Icon icon="mdi:file-document" className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate max-w-[180px]">{file.name}</span>
                        </div>
                        <button 
                          onClick={() => removeFile(index)}
                          className="p-0.5 hover:text-destructive transition-colors"
                          aria-label={`Remove ${file.name}`}
                        >
                          <Icon icon="mdi:close" className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0}
                className="w-full h-8 text-xs font-medium text-primary-foreground bg-primary 
                         hover:bg-primary/90 rounded transition-colors disabled:opacity-50 
                         disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Chapters'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
} 