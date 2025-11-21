import { Handler } from '@netlify/functions';
import app from '../../backend/hono';

export const handler: Handler = async (event, context) => {
  const url = new URL(event.path, `https://${event.headers.host}`);
  
  if (event.queryStringParameters) {
    Object.entries(event.queryStringParameters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });
  }

  const request = new Request(url.toString(), {
    method: event.httpMethod,
    headers: new Headers(event.headers as Record<string, string>),
    body: event.body ? event.body : undefined,
  });

  try {
    const response = await app.fetch(request);
    
    const responseBody = await response.text();
    const headers: Record<string, string> = {};
    
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      statusCode: response.status,
      headers,
      body: responseBody,
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
