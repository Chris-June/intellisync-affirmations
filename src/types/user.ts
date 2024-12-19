export type Language = 
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'nl' // Dutch
  | 'ru' // Russian
  | 'zh' // Chinese
  | 'ja' // Japanese
  | 'ko'; // Korean

export type ImageStyle =
  | 'realistic'
  | 'watercolor'
  | 'oil-painting'
  | 'digital-art'
  | 'minimalist'
  | 'abstract'
  | 'pencil-sketch'
  | 'pop-art'
  | 'japanese-art'
  | 'cyberpunk';

export interface UserInfo {
  goals: string[];
  interests: string[];
  challengeAreas: string[];
  preferredTone: 'motivational' | 'gentle' | 'direct' | 'philosophical';
  preferredLength: 'short' | 'medium' | 'long';
  language: Language;
  imageStyle: ImageStyle;
}
