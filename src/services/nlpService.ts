import { removeStopwords } from 'stopword';

// Function to remove stop words from text
export const removeStopWords = (text: string): string => {
  if (!text) return '';
  
  console.log('🔄 Removing stop words from:', text);
  
  // Split text into words and clean up
  const words = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 0); // Remove empty strings
  
  console.log('📝 Words after cleaning:', words);
  
  // Remove stop words
  const filteredWords = removeStopwords(words);
  console.log('✨ Words after removing stop words:', filteredWords);
  
  // Join the words back into a sentence
  const result = filteredWords.join(' ');
  console.log('🎯 Final processed text:', result);
  
  return result;
};

// Function to convert number words to digits
const convertNumberWordsToDigits = (text: string): string => {
  const numberWords: { [key: string]: string } = {
    'zero': '0',
    'one': '1',
    'two': '2',
    'three': '3',
    'four': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8',
    'nine': '9',
    'ten': '10',
    'eleven': '11',
    'twelve': '12',
    'thirteen': '13',
    'fourteen': '14',
    'fifteen': '15',
    'sixteen': '16',
    'seventeen': '17',
    'eighteen': '18',
    'nineteen': '19',
    'twenty': '20',
    'thirty': '30',
    'forty': '40',
    'fifty': '50',
    'sixty': '60',
    'seventy': '70',
    'eighty': '80',
    'ninety': '90',
    'hundred': '100',
    'thousand': '1000'
  };

  // Convert text to lowercase for matching
  const lowerText = text.toLowerCase();
  
  // Replace number words with their digits
  let processedText = lowerText;
  Object.entries(numberWords).forEach(([word, digit]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    processedText = processedText.replace(regex, digit);
  });

  return processedText;
};

// Function to process translation result
export const processTranslation = (translation: string): { text: string; confidence: number } => {
  if (!translation) {
    console.log('⚠️ No text to process');
    return { text: '', confidence: 0 };
  }

  console.log('🔄 Starting NLP processing for:', translation);
  
  // First convert number words to digits
  const textWithDigits = convertNumberWordsToDigits(translation);
  console.log('📝 Text after number word conversion:', textWithDigits);
  
  // Then split numbers into individual digits
  const processedText = textWithDigits.replace(/\d+/g, match => match.split('').join(' '));
  console.log('📝 Text after number processing:', processedText);
  
  // Remove stop words
  const textWithoutStopWords = removeStopWords(processedText);
  
  // Capitalize first letter of the sentence
  const result = textWithoutStopWords.charAt(0).toUpperCase() + textWithoutStopWords.slice(1);
  console.log('✨ Final NLP result:', result);
  
  // Return processed text with confidence score
  return {
    text: result,
    confidence: 1.0 // Since this is a simple text processing, we can assume high confidence
  };
}; 