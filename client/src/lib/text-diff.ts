export interface DiffSegment {
  text: string;
  type: 'unchanged' | 'changed';
}

export function computeTextDiff(original: string, modified: string): DiffSegment[] {
  if (!original || !modified) {
    return [{ text: modified, type: 'unchanged' }];
  }

  // Simple word-level diff algorithm
  const originalWords = original.split(/\s+/);
  const modifiedWords = modified.split(/\s+/);
  const segments: DiffSegment[] = [];
  
  let i = 0;
  let j = 0;
  let currentSegment = '';
  let currentType: 'unchanged' | 'changed' = 'unchanged';

  while (j < modifiedWords.length) {
    const modWord = modifiedWords[j];
    
    // Try to find this word in the original text starting from current position
    let found = false;
    for (let k = i; k < Math.min(i + 5, originalWords.length); k++) {
      if (originalWords[k].toLowerCase() === modWord.toLowerCase()) {
        found = true;
        i = k + 1;
        break;
      }
    }

    const wordType: 'unchanged' | 'changed' = found ? 'unchanged' : 'changed';
    
    if (wordType === currentType) {
      currentSegment += (currentSegment ? ' ' : '') + modWord;
    } else {
      if (currentSegment) {
        segments.push({ text: currentSegment, type: currentType });
      }
      currentSegment = modWord;
      currentType = wordType;
    }
    
    j++;
  }

  if (currentSegment) {
    segments.push({ text: currentSegment, type: currentType });
  }

  return segments;
}

export function calculateChangePercentage(original: string, modified: string): number {
  if (!original || !modified) return 0;
  
  const segments = computeTextDiff(original, modified);
  const changedWords = segments
    .filter(s => s.type === 'changed')
    .reduce((acc, s) => acc + s.text.split(/\s+/).length, 0);
  
  const totalWords = modified.trim().split(/\s+/).length;
  
  return totalWords > 0 ? Math.round((changedWords / totalWords) * 100) : 0;
}
