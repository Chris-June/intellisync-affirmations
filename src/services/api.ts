import type { UserInfo } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Check if server is running
export const checkServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

export const generateAffirmation = async (
  userInfo: UserInfo,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  extend: boolean = false,
  previousAffirmation?: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-affirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInfo, extend, previousAffirmation }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || 'Failed to generate affirmation');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Stream not available');

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onComplete();
            break;
          }
          const chunk = new TextDecoder().decode(value);
          onChunk(chunk);
        }
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          await processStream();
        } else {
          throw error;
        }
      }
    };

    await processStream();
  } catch (error) {
    console.error('Error in generateAffirmation:', error);
    throw error;
  }
};

export const generateImage = async (
  affirmation: string,
  referenceImage?: string
): Promise<string | null> => {
  try {
    let stylePrompt = '';
    if (referenceImage) {
      const styleResponse = await fetch(`${API_BASE_URL}/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referenceImage })
      });
      
      if (styleResponse.ok) {
        const { stylePrompt: newStylePrompt } = await styleResponse.json();
        stylePrompt = newStylePrompt;
      }
    }

    const response = await fetch(`${API_BASE_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        affirmation,
        stylePrompt
      })
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.error.code === 'rate_limit_exceeded') {
        console.warn('Rate limit exceeded, will retry later');
        return null;
      }
      throw new Error(error.error.message || 'Failed to generate image');
    }

    const { imageUrl } = await response.json();
    return imageUrl;
  } catch (error) {
    console.error('Error in generateImage:', error);
    return null;
  }
};

export const generateSpeech = async (
  text: string,
  onChunk: (chunk: ArrayBuffer) => void,
  onComplete: () => void
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || 'Failed to generate speech');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Stream not available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onComplete();
        break;
      }
      onChunk(value.buffer);
    }
  } catch (error) {
    console.error('Error in generateSpeech:', error);
    throw error;
  }
};

export const transcribeSpeech = async (audioBlob: Blob): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/transcribe-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav',
      },
      body: audioBlob
    });

    if (!response.ok) {
      throw new Error('Failed to transcribe speech');
    }

    const { text } = await response.json();
    return text;
  } catch (error) {
    console.error('Error transcribing speech:', error);
    return null;
  }
};
