import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// Optional: cache the words for 60 seconds to reduce DB load
let cachedWords = null;
let lastCacheTime = 0;

async function getCensoredWords() {
  const now = Date.now();
  if (cachedWords && (now - lastCacheTime < 60000)) {
    return cachedWords;
  }
  try {
    const words = await prisma.censoredWord.findMany({
      select: { word: true }
    });
    cachedWords = words.map(w => w.word.toLowerCase());
    lastCacheTime = now;
    return cachedWords;
  } catch (err) {
    console.error("[Censor] Error fetching words:", err);
    return [];
  }
}

/**
 * Censors forbidden words in a text string by replacing them with asterisks.
 * Uses case-insensitive word boundary matching.
 */
export async function censorText(text) {
  if (!text || typeof text !== 'string') return text;

  const words = await getCensoredWords();
  if (words.length === 0) return text;

  let censoredText = text;

  // Sort words by length descending to prevent partial replacement of longer words first
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  sortedWords.forEach((word) => {
    // Escape special regex characters in the forbidden word
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Using word boundaries \b to avoid matches inside other words
    // We use a non-capturing group for boundaries to handle various punctation
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    
    censoredText = censoredText.replace(regex, (match) => {
      return '*'.repeat(match.length);
    });
  });

  return censoredText;
}

/**
 * Checks if a username is in the forbidden words list.
 * Per requirement: "no one can create a username with these words (by themselves only)"
 */
export async function isForbiddenUsername(username) {
  if (!username) return false;

  const forbiddenWords = await getCensoredWords();
  const lowerUsername = username.toLowerCase().trim();

  // "by themselves only" means the username IS the forbidden word
  return forbiddenWords.includes(lowerUsername);
}
