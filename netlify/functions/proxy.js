/**
 * Netlify Function Proxy for FirstMail API (using native fetch).
 * This function handles CORS and forwards the request to the external API.
 */
// Define the actual target API endpoint
const TARGET_API_URL = "https://api.firstmail.ltd/v1/mail/change/password";

// Netlify's standard handler format
exports.handler = async (event) => {
  // 1. Handle CORS Pre-flight (OPTIONS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    };
  }
  
  const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
  };

  // 2. Handle the actual POST request
  try {
    if (!event.body) {
      throw new Error("Request body is missing.");
    }

    const requestJson = JSON.parse(event.body);
    const { username: mail, cpassword: cpass, npassword: npass, api_key } = requestJson;

    if (!mail || !cpass || !npass || !api_key) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const apiPayload = {
      username: mail,
      cpassword: cpass,
      npassword: npass,
    };
    const apiHeaders = {
      "Content-Type": "application/json",
      "X-API-KEY": api_key,
    };

    const response = await fetch(TARGET_API_URL, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(apiPayload),
    });

    const resultJson = await response.json();
    
    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify(resultJson),
    };

  } catch (e) {
    console.error("Internal proxy error:", e);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Internal proxy error: ${e.message}` }),
    };
  }
};

