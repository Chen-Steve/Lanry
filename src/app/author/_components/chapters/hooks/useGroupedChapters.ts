"use client";

import { useMemo } from "react";
import { ChapterListChapter, Volume } from "../../../_types/authorTypes";

function sortChaptersAscending(a: ChapterListChapter, b: ChapterListChapter): number {
  // Extra chapters (part -1) first
  if (a.part_number === -1 && b.part_number !== -1) return -1;
  if (a.part_number !== -1 && b.part_number === -1) return 1;

  // Then by chapter number
  if (a.chapter_number !== b.chapter_number) return a.chapter_number - b.chapter_number;

  // Then by part number (treat undefined as 0)
  const partA = a.part_number ?? 0;
  const partB = b.part_number ?? 0;
  return partA - partB;
}

export function useGroupedChapters(
  chapters: ChapterListChapter[],
  volumes: Volume[],
  searchQuery: string,
  isDescending: boolean
) {
  return useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();
    const filtered = chapters.filter((chapter) => {
      if (!searchLower) return true;
      return (
        chapter.title?.toLowerCase().includes(searchLower) ||
        chapter.chapter_number.toString().includes(searchLower) ||
        (!!chapter.part_number && chapter.part_number.toString().includes(searchLower))
      );
    });

    const volumeChapters = new Map<string, ChapterListChapter[]>();
    volumes.forEach((v) => (volumeChapters as Map<string, ChapterListChapter[]>).set(v.id, []));

    const noVolumeChapters: ChapterListChapter[] = [];

    for (const c of filtered) {
      if (c.volume_id && volumeChapters.has(c.volume_id)) {
        (volumeChapters.get(c.volume_id) as ChapterListChapter[]).push(c);
      } else {
        noVolumeChapters.push(c);
      }
    }

    // Sort
    for (const [key, arr] of volumeChapters.entries()) {
      arr.sort(sortChaptersAscending);
      if (isDescending) arr.reverse();
      volumeChapters.set(key, arr);
    }

    noVolumeChapters.sort(sortChaptersAscending);
    if (isDescending) noVolumeChapters.reverse();

    return { volumeChapters, noVolumeChapters };
  }, [chapters, volumes, searchQuery, isDescending]);
}


