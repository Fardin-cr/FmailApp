/**
 * Netlify Function Proxy for FirstMail API.
 * This function handles CORS and forwards the request to the external API.
 * * To use:
 * 1. Create a folder named 'netlify' in your repo root.
 * 2. Inside 'netlify', create a folder named 'functions'.
 * 3. Place this file inside 'netlify/functions/'.
 * 4. The public URL will be: YOUR_DOMAIN/.netlify/functions/proxy
 */

// Define the actual target API endpoint
const TARGET_API_URL = "https://api.firstmail.ltd/v1/mail/change/password";

// Netlify's standard handler format
exports.handler = async (event) => {
  // 1. Handle CORS Pre-flight (OPTIONS) request sent by the browser
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204, // No Content
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400", // Cache pre-flight response for 24 hours
      },
    };
  }
  
  // Set the default CORS header for all actual responses
  const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
  };

  // 2. Handle the actual POST request
  try {
    // Ensure the request body is present
    if (!event.body) {
        throw new Error("Request body is missing.");
    }

    const requestJson = JSON.parse(event.body);

    // Extract data sent from the web app
    const { username: mail, cpassword: cpass, npassword: npass, api_key } = requestJson;

    // Validate required fields
    if (!mail || !cpass || !npass || !api_key) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required fields (username, cpassword, npassword, api_key)" }),
      };
    }

    // 3. Prepare payload and headers for the actual external API call
    const apiPayload = {
      username: mail,
      cpassword: cpass,
      npassword: npass,
    };
    const apiHeaders = {
      "Content-Type": "application/json",
      "X-API-KEY": api_key, // Use the key passed from the client
    };

    // 4. Make the external API call (server-to-server) using fetch
    const response = await fetch(TARGET_API_URL, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(apiPayload),
    });

    const resultJson = await response.json();
    
    // 5. Return the result from the external API to the client
    return {
      statusCode: response.status,
      headers: corsHeaders,
      body: JSON.stringify(resultJson),
    };

  } catch (e) {
    // Handle any other internal errors (like JSON parsing issues or network errors)
    console.error("Internal proxy error:", e);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Internal proxy error: ${e.message}` }),
    };
  }
};

