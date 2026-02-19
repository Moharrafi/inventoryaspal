import { GoogleGenAI } from "@google/genai";
import { Product, SalesData, Transaction } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBusinessInsights = async (
  products: Product[],
  transactions: Transaction[],
  salesData: SalesData[]
): Promise<string> => {
  try {
    const prompt = `
      You are a senior business analyst for "AspalPro", an asphalt emulsion waterproofing company.
      Analyze the following data JSON and provide 3-4 strategic insights and recommendations.
      Focus on inventory optimization, sales trends, and potential risks.
      
      Data:
      Products: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stock, status: p.status })))}
      Recent Transactions: ${JSON.stringify(transactions.slice(0, 5))}
      Monthly Sales Trend: ${JSON.stringify(salesData.slice(-3))}
      
      Output format:
      Use clear headers and bullet points. Be professional and concise.
      Formatting: Use Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Could not generate insights at this time. Please check your API key or internet connection.";
  }
};