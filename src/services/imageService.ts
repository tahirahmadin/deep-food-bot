export class ImageService {
    private readonly openaiKey: string;
  
    constructor() {
      const openaiKey = import.meta.env.VITE_PUBLIC_OPENAI_API_KEY;
      if (!openaiKey) throw new Error('OpenAI API key not found');
      this.openaiKey = openaiKey;
    }
  
    async analyzeImage(file: File): Promise<string> {
      try {
        const base64Image = await this.fileToBase64(file);
        console.log('Base64 Image:', base64Image.substring(0, 100) + '...');
        
        const requestBody = {
          model: "gpt-4o-mini",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: "What is in this image?" },
              { 
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }]
        };
        
        console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiKey}`
          },
          body: JSON.stringify(requestBody)
        });
  
        console.log('Response Status:', response.status);
        const responseData = await response.text();
        console.log('Response Data:', responseData);
  
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${responseData}`);
        }
  
        const data = JSON.parse(responseData);
        return data.choices[0].message.content;
      } catch (error) {
        console.error('Analysis error:', error);
        throw error;
      }
    }
  
    private fileToBase64(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          }
        };
        reader.onerror = error => reject(error);
      });
    }
  }