/**
 * Netlify Function Proxy for FirstMail API.
 * This function handles CORS and forwards the request to the external API.
 * * To use: 
 * 1. Create a folder named 'netlify' in your repo root.
 * 2. Inside 'netlify', create a folder named 'functions'.
 * 3. Place this file inside 'netlify/functions/'.
 * * The public URL will be: YOUR_DOMAIN/.netlify/functions/proxy
 */

// Define the actual target API endpoint
const TARGET_API_URL = "https://api.firstmail.ltd/v1/mail/change/password";

// Netlify's standard handler format
exports.handler = async (event) => {
    // 1. Handle CORS Pre-flight (OPTIONS)
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204, // No content
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400", // Cache pre-flight response for 24 hours
            },
        };
    }

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    };

    try {
        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405,
                headers: corsHeaders,
                body: JSON.stringify({ error: "Method Not Allowed" }),
            };
        }

        const requestBody = JSON.parse(event.body);
        
        // Extract data sent from the web app
        const { username, cpassword, npassword, api_key } = requestBody;
        
        // Validate required fields
        if (!username || !cpassword || !npassword || !api_key) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: "Missing required fields (username, cpassword, npassword, api_key)" }),
            };
        }

        // 2. Make the external API call (Server-to-Server)
        const apiResponse = await fetch(TARGET_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': api_key // Use the key passed from the client
            },
            body: JSON.stringify({
                username,
                cpassword,
                npassword
            })
        });

        // 3. Return the external API result to the client
        const externalResponseBody = await apiResponse.json().catch(() => ({ 
            error: apiResponse.statusText || 'API returned non-JSON response.',
            raw_status: apiResponse.status 
        }));
        
        return {
            statusCode: apiResponse.status,
            headers: corsHeaders,
            body: JSON.stringify(externalResponseBody),
        };

    } catch (error) {
        console.error("Proxy error:", error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: `Internal proxy error: ${error.message}` }),
        };
    }
};

