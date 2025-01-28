// List of words to be censored - can be expanded as needed
const EXPLICIT_WORDS = [
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'cock',
  'cocksucker',
  'motherfucker',
  'cunt',
  'dick',
  'fuck',
  'pussy',
  'shit',
  'slut',
  'whore',
  'slave',
];

// Function to censor a word while keeping some characters visible
const censorWord = (word: string): string => {
  if (word.length <= 2) return word; // Don't censor very short words
  
  // For 3-letter words, just replace middle letter
  if (word.length === 3) {
    return word[0] + '*' + word[2];
  }
  
  // For longer words, keep first and last letters, put one * in middle
  const firstChar = word[0];
  const lastChar = word[word.length - 1];
  const middleIndex = Math.floor(word.length / 2);
  
  return word.split('').map((char, index) => {
    if (index === 0) return firstChar;
    if (index === word.length - 1) return lastChar;
    if (index === middleIndex) return '*';
    return char;
  }).join('');
};

// Function to check if a word should be censored
const shouldCensorWord = (word: string): boolean => {
  const lowerWord = word.toLowerCase();
  // Only match exact words, not parts of words
  return EXPLICIT_WORDS.some(explicit => 
    // Match exact word or word with basic punctuation
    new RegExp(`^${explicit}[.,!?]?$`, 'i').test(lowerWord)
  );
};

// Main function to filter content
export const filterExplicitContent = (text: string): string => {
  return text.split(/\b/).map(part => {
    // If it's not a word (whitespace, punctuation), return as is
    if (!/\w/.test(part)) return part;
    
    return shouldCensorWord(part) ? censorWord(part) : part;
  }).join('');
};

// Function to check if text contains any explicit content
export const containsExplicitContent = (text: string): boolean => {
  const words = text.toLowerCase().split(/\b/);
  return words.some(word => shouldCensorWord(word));
}; 