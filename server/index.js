import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { rateLimit } from 'express-rate-limit';

const app = express();
app.use(cors());
app.use(express.json());

// Create rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.'
});

// Apply rate limiting to all routes
app.use(apiLimiter);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Queue for managing API requests
const queue = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  const { task, resolve, reject } = queue.shift();
  
  try {
    const result = await task();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    setTimeout(() => processQueue(), 1000); // Wait 1 second between requests
  }
};

const queueTask = (task) => {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    processQueue();
  });
};

// Middleware to validate user info
const validateUserInfo = (req, res, next) => {
  const { userInfo } = req.body;
  if (!userInfo || !userInfo.goals || !userInfo.interests || !userInfo.challengeAreas || !userInfo.preferredTone || !userInfo.preferredLength || !userInfo.language) {
    return res.status(400).json({
      error: 'Invalid user info. Required fields: goals, interests, challengeAreas, preferredTone, preferredLength, language'
    });
  }
  next();
};

// Generate system prompt
const getSystemPrompt = (userInfo) => {
  const {
    goals,
    interests,
    challengeAreas,
    preferredTone,
    preferredLength,
    language
  } = userInfo;

  // Language-specific tone adjustments
  const toneAdjustments = {
    en: {
      motivational: 'energetic and inspiring',
      gentle: 'soft and nurturing',
      direct: 'clear and straightforward',
      philosophical: 'thought-provoking and wise'
    },
    es: {
      motivational: 'energético e inspirador',
      gentle: 'suave y nutritivo',
      direct: 'claro y directo',
      philosophical: 'reflexivo y sabio'
    },
    // Add other languages...
  };

  const tone = toneAdjustments[language]?.[preferredTone] || toneAdjustments.en[preferredTone];
  
  return `You are an expert affirmation creator who specializes in creating personalized, powerful affirmations.
Generate affirmations in ${language} that are ${tone}.
The affirmation should be ${preferredLength} in length.

Consider the following about the user:
- Goals: ${goals.join(', ')}
- Interests: ${interests.join(', ')}
- Challenge Areas: ${challengeAreas.join(', ')}

Create affirmations that:
1. Are personal and emotionally resonant
2. Focus on growth and possibility
3. Use present tense
4. Are positive and empowering
5. Are specific to the user's goals and challenges`;
};

// Create affirmation endpoint
app.post('/api/create-affirmation', validateUserInfo, async (req, res) => {
  const { userInfo, extend, previousAffirmation } = req.body;
  
  try {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await queueTask(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(userInfo)
          },
          {
            role: 'user',
            content: extend && previousAffirmation
              ? `Previous affirmation: "${previousAffirmation}"\n\nCreate a new affirmation that builds upon this theme while introducing a fresh perspective or deeper insight.`
              : 'Create a powerful, personalized affirmation that resonates with my context.'
          }
        ],
        temperature: 0.85,
        max_tokens: 150,
        presence_penalty: 0.3,
        frequency_penalty: 0.6,
        stream: true
      });
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error generating affirmation:', error);
    res.status(error.status || 500).json({
      error: {
        message: error.message || 'An error occurred during affirmation generation',
        code: error.code || 'unknown_error'
      }
    });
  }
});

// Speech generation endpoint
app.post('/api/generate-speech', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: { message: 'Text is required' } });
  }

  try {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await queueTask(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a speech optimization expert. Convert the given text into natural, flowing speech that maintains its inspirational quality.'
          },
          {
            role: 'user',
            content: `Optimize this affirmation for speech: "${text}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        stream: true
      });
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: { message: 'Failed to generate speech' } });
  }
});

// Speech transcription endpoint
app.post('/api/transcribe-speech', async (req, res) => {
  try {
    const transcription = await queueTask(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a speech-to-text expert. Transcribe the audio accurately while maintaining its emotional resonance.'
          },
          {
            role: 'user',
            content: 'Please transcribe this audio file.'
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      });
      return completion.choices[0]?.message?.content;
    });

    res.json({ text: transcription });
  } catch (error) {
    console.error('Error transcribing speech:', error);
    res.status(500).json({ error: { message: 'Failed to transcribe speech' } });
  }
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
  try {
    const { affirmation, imageStyle } = req.body;

    // First, generate the image description using GPT-4o-mini
    const imagePrompt = await queueTask(async () => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating detailed, vivid image descriptions for DALL-E.'
          },
          {
            role: 'user',
            content: `Create a detailed image description for this affirmation: "${affirmation}" in ${imageStyle} style.`
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      });
      return completion.choices[0]?.message?.content;
    });

    // Then generate the image using DALL-E
    const response = await queueTask(async () => {
      return await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      });
    });

    res.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: { message: 'Failed to generate image' } });
  }
});

// Image analysis endpoint
app.post('/api/analyze-image', async (req, res) => {
  const { referenceImage } = req.body;
  
  try {
    const response = await queueTask(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image's style and describe it in terms that could be used to generate a similar style image." },
              {
                type: "image_url",
                image_url: { url: referenceImage }
              },
            ],
          },
        ],
      });
    });

    res.json({ stylePrompt: response.choices[0]?.message?.content });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(error.status || 500).json({
      error: {
        message: error.message || 'An error occurred during image analysis',
        code: error.code || 'unknown_error'
      }
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
