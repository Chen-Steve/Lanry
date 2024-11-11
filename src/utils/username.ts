export function generateUsername(): string {
  const adjectives = [
    'Happy', 'Clever', 'Brave', 'Wise', 'Swift', 'Noble', 'Bright',
    'Kind', 'Bold', 'Calm', 'Eager', 'Fair', 'Grand', 'Keen'
  ];
  
  const nouns = [
    'Reader', 'Scholar', 'Knight', 'Sage', 'Phoenix', 'Dragon', 'Tiger',
    'Eagle', 'Wolf', 'Lion', 'Falcon', 'Raven', 'Owl', 'Bear'
  ];
  
  const randomNumber = Math.floor(Math.random() * 10000);
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${randomNumber}`;
} 