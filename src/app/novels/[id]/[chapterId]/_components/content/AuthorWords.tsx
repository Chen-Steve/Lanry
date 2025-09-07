'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import supabase from '@/lib/supabaseClient';
import { getTextStyles, formatText } from '@/lib/textFormatting';
import { filterExplicitContent } from '@/lib/contentFiltering';
import { TranslatorLinks } from '@/app/novels/[id]/_components/TranslatorLinks';
import { Avatar } from '@/components/ui/avatar';

interface AuthorProfile {
  username: string;
  avatar_url?: string;
  role: 'AUTHOR' | 'TRANSLATOR' | 'USER';
  kofiUrl?: string;
  patreonUrl?: string;
  customUrl?: string;
  customUrlLabel?: string;
  author_bio?: string;
}

interface AuthorWordsProps {
  authorThoughts: string;
  authorProfile?: AuthorProfile;
  authorId: string;
  fontFamily: string;
  fontSize: number;
  showProfanity?: boolean;
  novelId: string;
  chapterNumber: number;
}

function AuthorWords({
  authorThoughts,
  authorProfile,
  authorId,
  fontFamily,
  fontSize,
  showProfanity = false,
  novelId,
  chapterNumber
}: AuthorWordsProps) {
  const hasThoughts = typeof authorThoughts === 'string' && authorThoughts.trim() !== '';
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(0);

  // Safe URL checker reused in sanitizers
  const isSafeHttpUrl = useCallback((url: string): boolean => {
    try {
      const u = new URL(url, window.location.origin);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  // Sanitize HTML if authorThoughts already contains HTML tags
  const sanitizeHtml = useCallback((input: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'text/html');

      const ALLOWED_TAGS = new Set([
        'p', 'br', 'div', 'span', 'strong', 'em', 'u', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr', 'img', 'a'
      ]);

      const DEFAULT_ATTRS = new Set(['class']);
      const ATTRS_BY_TAG: Record<string, Set<string>> = {
        a: new Set(['href', 'title', 'target', 'rel', 'class']),
        img: new Set(['src', 'alt', 'title', 'loading', 'class'])
      };

      const walk = (node: Node) => {
        // Apply profanity filter and auto-link URLs in text nodes (without breaking HTML)
        if (node.nodeType === Node.TEXT_NODE) {
          const original = node.nodeValue ?? '';
          const parent = node.parentNode as HTMLElement | null;
          const parentTag = parent?.tagName?.toLowerCase();

          // Do not transform inside anchors or images
          if (parentTag === 'a' || parentTag === 'img' || parentTag === 'script' || parentTag === 'style') return;

          const urlRegex = /(https?:\/\/[^\s<>"]+)/gi;
          let hasUrl = false;
          const parts: Array<string> = [];
          let lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = urlRegex.exec(original)) !== null) {
            hasUrl = true;
            parts.push(original.slice(lastIndex, m.index));
            parts.push(m[0]);
            lastIndex = m.index + m[0].length;
          }
          parts.push(original.slice(lastIndex));

          const processText = (text: string) => (showProfanity ? text : filterExplicitContent(text, true));

          if (hasUrl && parent) {
            const frag = doc.createDocumentFragment();
            for (let i = 0; i < parts.length; i++) {
              const segment = parts[i];
              if (i % 2 === 1) {
                // URL segment
                const url = segment;
                const isImage = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url);
                if (isImage) {
                  const img = doc.createElement('img');
                  img.setAttribute('src', url);
                  img.setAttribute('alt', '');
                  img.setAttribute('loading', 'lazy');
                  img.setAttribute('class', 'max-w-full h-auto rounded-lg my-2');
                  frag.appendChild(img);
                } else {
                  const a = doc.createElement('a');
                  a.setAttribute('href', url);
                  a.setAttribute('target', '_blank');
                  a.setAttribute('rel', 'noopener noreferrer nofollow');
                  a.setAttribute('class', 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300');
                  a.textContent = url;
                  frag.appendChild(a);
                }
              } else if (segment) {
                const span = doc.createElement('span');
                span.innerHTML = processText(segment);
                frag.appendChild(span);
              }
            }
            parent.insertBefore(frag, node);
            parent.removeChild(node);
            return; // replaced node
          } else {
            const filtered = processText(original);
            if (filtered !== original && parent) {
              const wrapper = doc.createElement('span');
              wrapper.innerHTML = filtered;
              while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, node);
              parent.removeChild(node);
              return; // this node was replaced
            }
          }
        }

        // Remove script/style entirely
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();

          if (tag === 'script' || tag === 'style') {
            el.remove();
            return;
          }

          // Recurse into children first
          const children = Array.from(el.childNodes);
          for (const child of children) walk(child);

          if (!ALLOWED_TAGS.has(tag)) {
            // Unwrap disallowed tag but keep its children content
            const parent = el.parentNode;
            if (parent) {
              while (el.firstChild) parent.insertBefore(el.firstChild, el);
              parent.removeChild(el);
            }
            return;
          }

          // Clean attributes
          const allowed = ATTRS_BY_TAG[tag] || DEFAULT_ATTRS;
          for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            const value = attr.value;

            // Remove event handlers and unknown attributes
            if (name.startsWith('on') || !allowed.has(name)) {
              el.removeAttribute(attr.name);
              continue;
            }

            if (tag === 'a' && name === 'href') {
              if (!isSafeHttpUrl(value)) {
                el.removeAttribute('href');
              } else {
                // Ensure safe target rel combo
                if (el.getAttribute('target') === '_blank') {
                  el.setAttribute('rel', 'noopener noreferrer nofollow');
                }
              }
            }

            if (tag === 'img' && name === 'src') {
              if (!isSafeHttpUrl(value)) {
                el.removeAttribute('src');
              } else {
                if (!el.getAttribute('loading')) el.setAttribute('loading', 'lazy');
              }
            }
          }
        }
      };

      walk(doc.body);
      return doc.body.innerHTML;
    } catch {
      // On failure, fall back to escaped text
      return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [isSafeHttpUrl, showProfanity]);

  // Decode common HTML entities so we can detect pre-escaped HTML and then sanitize it
  const decodeEntities = useCallback((input: string): string => {
    try {
      let prev = input;
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('textarea');
        el.innerHTML = prev;
        const next = el.value;
        if (next === prev) break;
        prev = next;
      }
      return prev;
    } catch {
      return input;
    }
  }, []);

  // Build a sandboxed iframe HTML that preserves style tags but strips scripts and unsafe attrs
  const buildIframeHtml = useCallback((rawHtml: string): string => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      const walk = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tag = el.tagName.toLowerCase();

          if (tag === 'script') {
            el.remove();
            return;
          }

          // Recurse first
          const children = Array.from(el.childNodes);
          for (const child of children) walk(child);

          // Clean attributes (disallow event handlers)
          for (const attr of Array.from(el.attributes)) {
            const name = attr.name.toLowerCase();
            const value = attr.value;
            if (name.startsWith('on')) {
              el.removeAttribute(attr.name);
              continue;
            }
            if (tag === 'a' && name === 'href') {
              if (!isSafeHttpUrl(value)) el.removeAttribute('href');
            }
            if (tag === 'img' && name === 'src') {
              if (!isSafeHttpUrl(value)) el.removeAttribute('src');
            }
          }

          if (tag === 'a') {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer nofollow');
          }
          if (tag === 'img') {
            if (!el.getAttribute('loading')) el.setAttribute('loading', 'lazy');
            el.classList.add('max-w-full', 'h-auto');
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const original = node.nodeValue ?? '';
          const parent = node.parentNode as HTMLElement | null;
          if (!parent) return;
          const filtered = showProfanity ? original : filterExplicitContent(original, true);
          if (filtered !== original) {
            const wrapper = doc.createElement('span');
            wrapper.innerHTML = filtered;
            while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, node);
            parent.removeChild(node);
          }
        }
      };

      walk(doc.body);

      const safeBody = doc.body.innerHTML;
      const baseStyles = `
        body { margin: 0; padding: 0; background: transparent; color: inherit; font-family: ${fontFamily}; font-size: ${Math.max(12, fontSize - 1)}px; }
        img { max-width: 100%; height: auto; }
        .prose { all: initial; font-family: inherit; font-size: inherit; }
      `;

      return `<!doctype html><html><head><meta charset="utf-8" />
        <base target="_blank" />
        <style>${baseStyles}</style>
      </head><body>
        <div class="prose">${safeBody}</div>
      </body></html>`;
    } catch {
      return rawHtml;
    }
  }, [fontFamily, fontSize, isSafeHttpUrl, showProfanity]);

  // Derive and memoize rendering decisions/content
  const looksLikeHtml = useMemo(() => {
    const raw = authorThoughts;
    return /</.test(raw) || /&(lt|gt|amp|quot|#39|#60|#62|#x3c|#x3e);/i.test(raw);
  }, [authorThoughts]);

  const decoded = useMemo(() => (looksLikeHtml ? decodeEntities(authorThoughts) : authorThoughts), [looksLikeHtml, authorThoughts, decodeEntities]);
  const decodedHasHtml = useMemo(() => /<\/?[a-zA-Z][^>]*>/.test(decoded), [decoded]);

  const iframeSrcDoc = useMemo(() => (decodedHasHtml ? buildIframeHtml(decoded) : ''), [decodedHasHtml, decoded, buildIframeHtml]);
  const renderedHtml = useMemo(() => {
    if (!decodedHasHtml) {
      return sanitizeHtml(
        formatText(filterExplicitContent(authorThoughts, !showProfanity))
      );
    }
    return '';
  }, [decodedHasHtml, authorThoughts, showProfanity, sanitizeHtml]);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const { data: chapter, error: chapterError } = await supabase
          .from('chapters')
          .select('id, like_count')
          .eq('chapter_number', chapterNumber)
          .eq('novel_id', novelId)
          .single();

        if (chapterError) throw chapterError;
        setLikeCount(chapter.like_count || 0);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error: likeError } = await supabase
            .from('chapter_likes')
            .select('id')
            .eq('chapter_id', chapter.id)
            .eq('profile_id', user.id);

          if (likeError) throw likeError;
          setIsLiked(!!(data && data.length > 0));
        }
      } catch {
        // Fail silently; do not disrupt content rendering
        // console.error('Error fetching likes:', err);
      }
    };

    fetchLikes();
  }, [chapterNumber, novelId]);

  const handleLikeClick = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Must be logged in to like chapters');
      return;
    }

    if (isLikeLoading) return;
    setIsLikeLoading(true);

    try {
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('id')
        .eq('chapter_number', chapterNumber)
        .eq('novel_id', novelId)
        .single();

      if (chapterError) throw chapterError;

      if (isLiked) {
        const { error: deleteLikeError } = await supabase
          .from('chapter_likes')
          .delete()
          .eq('chapter_id', chapter.id)
          .eq('profile_id', user.id);

        if (deleteLikeError) throw deleteLikeError;

        const { data: currentChapter, error: getCurrentError } = await supabase
          .from('chapters')
          .select('like_count')
          .eq('id', chapter.id)
          .single();

        if (getCurrentError) throw getCurrentError;
        const currentCount = currentChapter?.like_count || 0;
        const newCount = Math.max(0, currentCount - 1);

        const { error: updateError } = await supabase
          .from('chapters')
          .update({ like_count: newCount })
          .eq('id', chapter.id);

        if (updateError) throw updateError;

        setLikeCount(newCount);
        setIsLiked(false);
      } else {
        const now = new Date().toISOString();
        const { error: createLikeError } = await supabase
          .from('chapter_likes')
          .insert({
            id: crypto.randomUUID(),
            profile_id: user.id,
            chapter_id: chapter.id,
            novel_id: novelId,
            created_at: now,
            updated_at: now
          });

        if (createLikeError) throw createLikeError;

        const { data: currentChapter, error: getCurrentError } = await supabase
          .from('chapters')
          .select('like_count')
          .eq('id', chapter.id)
          .single();

        if (getCurrentError) throw getCurrentError;
        const currentCount = currentChapter?.like_count || 0;
        const newCount = currentCount + 1;

        const { error: updateError } = await supabase
          .from('chapters')
          .update({ like_count: newCount })
          .eq('id', chapter.id);

        if (updateError) throw updateError;

        setLikeCount(newCount);
        setIsLiked(true);
      }
    } catch {
      // console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLikeLoading(false);
    }
  }, [chapterNumber, isLikeLoading, isLiked, novelId]);

  return (
    <div className="mt-4 max-w-2xl mx-auto">
      <div className="bg-card rounded-lg border border-border shadow-sm p-2 md:p-3">
        <div className="not-prose flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {authorProfile && (
              <div className="flex-shrink-0 h-10 flex items-center">
                {authorProfile.avatar_url ? (
                  // Keep original <img> for robust onError fallback
                  <img
                    src={authorProfile.avatar_url}
                    alt={authorProfile.username}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = authorProfile.username[0]?.toUpperCase() || '?';
                        parent.className =
                          'w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-lg';
                      }
                    }}
                  />
                ) : (
                  <Avatar src={null} username={authorProfile.username} size={40} />
                )}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="m-0 text-base md:text-lg leading-none font-medium text-foreground truncate">
                {`${authorProfile?.username || 'Author'}'s words`}
              </h3>
            </div>
          </div>

          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
            title={isLiked ? 'Unlike chapter' : 'Like chapter'}
            aria-label={isLiked ? 'Unlike chapter' : 'Like chapter'}
            type="button"
          >
            <Icon icon={isLiked ? 'mdi:heart' : 'mdi:heart-outline'} className="w-5 h-5" />
            <span className="font-medium text-sm">{likeCount}</span>
          </button>
        </div>

        {hasThoughts && (
          decodedHasHtml ? (
            <iframe
              ref={iframeRef}
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              srcDoc={iframeSrcDoc}
              style={{
                width: '100%',
                border: 'none',
                height: iframeHeight ? `${iframeHeight}px` : 'auto',
                display: 'block',
                background: 'transparent'
              }}
              onLoad={() => {
                const iframe = iframeRef.current;
                if (!iframe) return;
                try {
                  const d = iframe.contentDocument;
                  const h = d ? d.body.scrollHeight : 0;
                  if (h && h !== iframeHeight) setIframeHeight(h);
                } catch {
                  // ignore
                }
              }}
            />
          ) : (
            <div
              className="prose prose-sm md:prose-base text-foreground dark:prose-invert mt-2 md:mt-3"
              style={getTextStyles(fontFamily, fontSize - 1)}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )
        )}

        {authorProfile && (
          <div className="mt-3 md:mt-4 pt-3 border-t border-border">
            <TranslatorLinks
              translator={{
                username: authorProfile.username,
                profile_id: authorId,
                kofiUrl: authorProfile.kofiUrl,
                patreonUrl: authorProfile.patreonUrl,
                customUrl: authorProfile.customUrl,
                customUrlLabel: authorProfile.customUrlLabel,
                author_bio: authorProfile.author_bio
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(AuthorWords);