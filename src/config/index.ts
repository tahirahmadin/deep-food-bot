// src/config/index.ts

export const config = {
    QUERY_DOCUMENT_API_URL: import.meta.env.VITE_PUBLIC_QUERY_DOCUMENT_API_URL || 'http://localhost:5000/query-document',
    RESTAURANT_ID: import.meta.env.VITE_RESTAURANT_ID,
    OPENAI_API_KEY: import.meta.env.VITE_PUBLIC_OPENAI_API_KEY,
    OPENAI_MODEL: 'gpt-3.5-turbo',
    DEFAULT_ERROR_MESSAGE: 'Sorry, something went wrong. Please try again.',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  } as const;
  
  // Type definitions for your environment variables
  declare global {
    interface ImportMetaEnv {
      VITE_PUBLIC_QUERY_DOCUMENT_API_URL: string;
      VITE_RESTAURANT_ID: string;
      VITE_PUBLIC_OPENAI_API_KEY: string;
    }
  }