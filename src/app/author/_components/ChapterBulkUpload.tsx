'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import * as authorChapterService from '../_services/authorChapterService';
import { useDropzone } from 'react-dropzone';
import { useEffect } from 'react';
import mammoth from 'mammoth';
import JSZip from 'jszip';

interface ChapterBulkUploadProps {
  novelId: string;
  userId: string;
  onUploadComplete: () => void;
}

interface FileToProcess {
  name: string;
  content: ArrayBuffer;
}

export default function ChapterBulkUpload({ novelId, userId, onUploadComplete }: ChapterBulkUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<FileToProcess[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

  const processZipFile = async (file: File): Promise<FileToProcess[]> => {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    const processableFiles: FileToProcess[] = [];

    for (const [path, zipEntry] of Object.entries(zipContent.files)) {
      if (!zipEntry.dir && (path.toLowerCase().endsWith('.docx') || path.toLowerCase().endsWith('.txt'))) {
        const content = await zipEntry.async('arraybuffer');
        processableFiles.push({
          name: path.split('/').pop() || path,
          content
        });
      }
    }

    if (processableFiles.length === 0) {
      toast.error('No .docx or .txt files found in the zip archive');
    }

    return processableFiles;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: FileToProcess[] = [];
    
    for (const file of acceptedFiles) {
      if (file.name.endsWith('.docx') || file.name.endsWith('.txt')) {
        const arrayBuffer = await file.arrayBuffer();
        newFiles.push({
          name: file.name,
          content: arrayBuffer
        });
      } else if (file.name.endsWith('.zip')) {
        const zipFiles = await processZipFile(file);
        newFiles.push(...zipFiles);
      } else {
        toast.error('Only .docx, .txt, and .zip files are allowed');
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip']
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileContent = async (file: FileToProcess): Promise<string> => {
    if (file.name.endsWith('.txt')) {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(file.content);
    } else {
      const result = await mammoth.extractRawText({ arrayBuffer: file.content });
      return result.value;
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    const failedUploads: { name: string; reason: string }[] = [];

    try {
      for (const file of files) {
        try {
          const content = await getFileContent(file);
          
          // First try to match the standard format (chapter2.docx or chapter2.txt)
          const standardMatch = /^chapter[\s-]?(\d+)\.(docx|txt)$/i.test(file.name);
          
          // Then try to match formats with titles
          // Matches: chapter2-title.docx, chapter 2-title.docx, chapter2: title.docx, chapter2_title.docx
          // And the same patterns for .txt files
          const titleMatch = file.name.match(/^chapter[\s-]?(\d+)(?:[-:_\s]+(.+?))?\.(docx|txt)$/i);

          if (!titleMatch) {
            failedUploads.push({ 
              name: file.name, 
              reason: 'invalid filename format'
            });
            continue;
          }

          const chapterNumber = parseInt(titleMatch[1]);
          let title = '';

          if (!standardMatch && titleMatch[2]) {
            // Clean up the title: remove extension, trim spaces
            title = titleMatch[2].trim();
          }

          await authorChapterService.createChapter(novelId, userId, {
            chapter_number: chapterNumber,
            title,
            content,
            publish_at: null,
            coins: 0,
          });
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          if (errorMessage.includes('already exists')) {
            failedUploads.push({ 
              name: file.name, 
              reason: 'duplicate chapter'
            });
          } else {
            failedUploads.push({ 
              name: file.name, 
              reason: errorMessage
            });
          }
        }
      }

      if (failedUploads.length === 0) {
        toast.success('All chapters uploaded successfully!');
        setFiles([]);
        onUploadComplete();
        setIsOpen(false);
      } else {
        const groupedFailures = failedUploads.reduce((acc, { name, reason }) => {
          if (!acc[reason]) {
            acc[reason] = [];
          }
          acc[reason].push(name);
          return acc;
        }, {} as Record<string, string[]>);

        Object.entries(groupedFailures).forEach(([reason, files]) => {
          const fileList = files.join(', ');
          if (reason === 'duplicate chapter') {
            toast.error(`Skipped duplicate chapters: ${fileList}`);
          } else {
            toast.error(`Failed to upload (${reason}): ${fileList}`);
          }
        });
      }
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
        className="inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        Upload
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
                        <ul className="space-y-1 list-disc ml-4">
                          <li>Accepts:
                            <div className="mt-1 space-y-1">
                              <span className="font-mono text-[10px] bg-accent px-1 rounded block">.docx files</span>
                              <span className="font-mono text-[10px] bg-accent px-1 rounded block">.txt files</span>
                              <span className="font-mono text-[10px] bg-accent px-1 rounded block">.zip containing .docx or .txt files</span>
                            </div>
                          </li>
                          <li>File names must be in format: 
                            <div className="mt-1 space-y-1">
                              <span className="font-mono text-[10px] bg-accent px-1 rounded block">chapterX.docx</span>
                              <span className="font-mono text-[10px] bg-accent px-1 rounded block">chapter X.docx</span>
                              <span className="font-mono text-[10px] bg-accent px-1 rounded block">chapter X: title.docx</span>
                              <span className="font-mono text-[10px] bg-accent px-1 rounded block">chapter X_title.docx</span>
                            </div>
                          </li>
                          <li>Where X is the chapter number</li>
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
                    {isDragActive ? 'Drop files here' : 'Drop .docx, .txt files or .zip archive'}
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