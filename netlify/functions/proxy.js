/**
 * Netlify Function Proxy for FirstMail API (with extensive logging for debugging).
 */
const fetch = require('node-fetch');

const TARGET_API_URL = "https://api.firstmail.ltd/v1/mail/change/password";

exports.handler = async (event) => {
  // --- EXTENSIVE LOGGING FOR DEBUGGING ---
  console.log("--- NEW FUNCTION INVOCATION ---");
  console.log("Received Event Object:", JSON.stringify(event, null, 2));
  // --- END LOGGING ---

  // 1. Handle CORS Pre-flight (OPTIONS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
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
    // Check for the request body
    if (!event.body) {
      const errorMessage = `Request body is missing. Method: ${event.httpMethod}. Headers: ${JSON.stringify(event.headers)}.`;
      console.error("CRITICAL ERROR:", errorMessage);
      throw new Error(errorMessage);
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

