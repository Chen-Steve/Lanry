/* eslint-disable @typescript-eslint/no-unused-vars */
// NOTE: This list is intentionally conservative – it contains the canonical form of each
// word we want to catch.  The matcher below will automatically catch common plural and
// conjugated variants such as "s", "es", "ed", "ing", etc. so we do *not* need to list
// every single variation here.
// Base list
const BASE_EXPLICIT_WORDS: string[] = [
  'anal',
  'anus',
  'arse',
  'arsehole',
  'ass',
  'asshole',
  'bastard',
  'bang',
  'bich',
  'bitch',
  'boob',
  'boobs',
  'bollock',
  'bollocks',
  'bullshit',
  'cock',
  'cocksucker',
  'creampie',
  'cuck',
  'cunt',
  'cum',
  'cumming',
  'cunnilingus',
  'dick',
  'dildo',
  'doggy',
  'dong',
  'dyke',
  'ejaculate',
  'fag',
  'faggot',
  'fellatio',
  'foreskin',
  'fuck',
  'gay',
  'gook',
  'jerk',
  'jizz',
  'kike',
  'lesbian',
  'masturbate',
  'milf',
  'molest',
  'motherfucker',
  'muff',
  'nigger',
  'nigga',
  'nonce',
  'orgasm',
  'pedo',
  'pedophile',
  'penis',
  'pecker',
  'piss',
  'prick',
  'pussy',
  'queer',
  'rape',
  'rapist',
  'rectum',
  'rimjob',
  'sex',
  'shit',
  'sissy',
  'skank',
  'slut',
  'spunk',
  'tits',
  'turd',
  'twat',
  'vagina',
  'vulva',
  'wank',
  'whore',
];

// Additional words gathered from user-provided list (de-duplicated automatically later)
const EXTRA_EXPLICIT_WORDS: string[] = [
  "bang","beaner","bellend","blowjob","boner","booty","bugger","bung","butt","asses","assed","assing","asslike","assholes","orgasms","orgasmic","arses","arsed","arsing","foreskins","shitting","boobies","bollocksed","cocked","cocking","beaners","bellends","boners","breasted","buggers","buggered","buggering","butts","butted","butting","cunted","cunting","coon","cameltoe","chink","choad","clit","knob","creampie","cum","cunnilingus","dick","dildo","doggy","dago","retard","diddle","dong","douche","dyke","faggot","fellatio","damn","gash","hebe","nigga","injun","jerk","coons","cameltoes","chinks","choads","clits","knobs","creampies","cumming","cunnilinguses","dildos","dagos","retards","retarded","faggots","fellatios","gays","damned","gooks","whored","whoring","injuns","jerks","jerked","jerking","jackoff","jap","jizz","kike","klan","negro","ladyboy","lesbian","milf","molest","muff","niggers","nipple","nonce","nutsack","pussy","penis","paki","pecker","pedophile","piss","prick","punani","queer","rectum","rim","slut","ballsack","schlong","scum","sissy","scums","ballsacks","retardation","punanis","pedophiles","pussywillow","nipples","molests","molested","molesting","milfs","ladyboys","negroes","klans","jackoffs","jackoffed","jackoffing","jizzes","jizzed","jizzing","sperm","spic","spunk","suck","tit","tits","turd","twat","vagina","vulva","wank","wetback","weenie","weiner","wop","hoe","homosexual","tranny","swine","fudge","redskin","testicles","genitals","genitalia","foreplay","rape","rapist","pubic","viagra","prostitute","prostitutes","prostitution","rapists","foreplays","genitalias","hoes","wops","vulvas","sperms","spics","spunks","turds","horny","areola","g-spot","crotch","erect","porn","labia","glans","uterus","cervix","fetish","climax","orgy","threesome","incest","handjob","bisexual","semen","horniness","g-spots","crotches","labias","glands","uteruses","cervixes","fetishes","orgies","threesomes","incestuous","handjobs","semens","clitoris","shits","whores","breasts","erection","erecting","kinky","raped","rapes","raping","naked","blowjobs","dicks","vaginal","cocks","areolas","climaxed","climaxing","climaxes","orgasming","orgasmed","buttocks","buttock","arsehole","anilingus","shite","bastards","biatch","bitched","bitchy","clitorises","erections","erects","erected","kinkiness","nakedness","vaginally","arseholes","anilinguses","shites","biatches","bitching","bitchier","bitchiest","bullshit","sucks","sucking","tard","wigger","wanker","twats","sluts","pedo","niggas","nympho","jizzstain","homo","wet","wetness","ejaculated","cums","jackarse","jackasses","bullshits","sucked","tards","wiggers","wankers","pedos","nymphos","jizzstains","jackarses","shitbag","shitface","shithole","shitty","shitter","shithead","piss","knobend","knobhead","godamnit","goddammit","gobshite","damnit","goddamn","precum","pussies","dumbasses","shitbags","shitfaces","shitholes","shittier","shittiest","shitters","shitheads",
];

const EXPLICIT_WORDS: string[] = Array.from(new Set([...BASE_EXPLICIT_WORDS, ...EXTRA_EXPLICIT_WORDS]));

// Common suffixes we want to allow (e.g. "fuck" -> "fucks", "fucking")
const COMMON_SUFFIXES = [
  '',  // exact match
  's', 'es', // plurals
  'ed', 'ing', // verb forms
  'er', 'ers', // agent nouns (e.g. "fucker")
  'y', 'ies', // e.g. "slutty", "pussies"
];

// Function to check if a word should be censored
const shouldCensorWord = (word: string): boolean => {
  // Remove surrounding punctuation so we only evaluate the core token
  const stripped = word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');

  // Iterate through each explicit root word and check if the stripped token is any
  // of its accepted suffix variations.
  for (const explicit of EXPLICIT_WORDS) {
    for (const suffix of COMMON_SUFFIXES) {
      if (stripped === explicit + suffix) {
        return true;
      }
    }
  }

  return false;
};

// Main function to filter content
export const filterExplicitContent = (
  text: string,
  conceal: boolean = true
): string => {
  return text.split(/\b/).map(part => {
    // If it's not a word (whitespace, punctuation), return as is
    if (!/\w/.test(part)) return part;

    if (shouldCensorWord(part)) {
      return conceal ? `<span class="censored-word">${part}</span>` : part;
    }

    return part;
  }).join('');
};

// Function to check if text contains any explicit content
export const containsExplicitContent = (text: string): boolean => {
  const words = text.toLowerCase().split(/\b/);
  return words.some(word => shouldCensorWord(word));
}; 