import requests
import json
# We don't need to import Flask, but Vercel expects the request object structure 
# from frameworks like Flask or a Cloud Function runner.
from flask import jsonify # Still using jsonify for clean JSON responses

# Define the actual target API endpoint
TARGET_API_URL = "https://api.firstmail.ltd/v1/mail/change/password"

def change_password_proxy(request):
    """
    Acts as a CORS-bypassing proxy for the FirstMail API.
    Handles OPTIONS request for CORS pre-flight and POST request for the password change.
    
    The 'request' object here is provided by the Vercel environment.
    """
    
    # 1. Handle CORS pre-flight request (OPTIONS)
    if request.method == 'OPTIONS':
        # These headers allow cross-origin requests from any domain (*)
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        # For an OPTIONS request, return an empty body with a 204 status code and CORS headers
        return ('', 204, headers)

    # 2. Handle POST request for the actual password change
    # Set the default CORS header for the response
    cors_header = {'Access-Control-Allow-Origin': '*'}

    try:
        # Check Content-Type and parse JSON
        # Vercel's request object uses get_data() for the raw body
        if request.headers.get('content-type') != 'application/json':
            raise ValueError(f"Unsupported Content-Type: {request.headers.get('content-type')}. Expected application/json.")

        # Vercel's request object can usually use get_json or requires parsing raw data
        # Let's try to get JSON directly, which is common in these environments
        try:
            request_json = request.get_json(silent=True)
        except Exception:
            # Fallback for environments where get_json isn't available
            raw_data = request.get_data()
            request_json = json.loads(raw_data.decode('utf-8'))
            
        if request_json is None:
            raise ValueError("Invalid JSON in request body.")

        # Extract data sent from the web app
        mail = request_json.get('username')
        cpass = request_json.get('cpassword')
        npass = request_json.get('npassword')
        api_key = request_json.get('api_key') # This is the X-API-KEY value

        # Validate required fields
        if not all([mail, cpass, npass, api_key]):
            # Use jsonify for clean response packaging
            return jsonify({"error": "Missing one or more required fields (username, cpassword, npassword, api_key)"}), 400, cors_header
        
        # 3. Prepare payload and headers for the actual external API call
        api_payload = {
            "username": mail,
            "cpassword": cpass,
            "npassword": npass
        }
        api_headers = {
            "content-type": "application/json",
            "X-API-KEY": api_key  # Use the key passed from the client
        }

        # 4. Make the external API call (server-to-server)
        response = requests.post(
            TARGET_API_URL, 
            json=api_payload, 
            headers=api_headers,
            timeout=10 # Set a timeout for safety
        )
        
        # 5. Return the result from the external API to the client
        # We need to explicitly check if the response body is empty before calling .json()
        result_json = {}
        try:
            result_json = response.json()
        except requests.exceptions.JSONDecodeError:
            # Handle case where API returns a non-JSON body (e.g., plain text error)
            result_json = {"error": response.text or "API returned non-JSON response."}
        
        # 6. Return the response to the client with the correct status code and CORS headers
        return jsonify(result_json), response.status_code, cors_header

    except requests.exceptions.RequestException as e:
        # Handle errors during the external API call
        return jsonify({"error": f"Proxy failed to reach target API: {str(e)}"}), 502, cors_header
    except Exception as e:
        # Handle other internal errors (like JSON parsing issues)
        return jsonify({"error": f"Internal proxy error: {type(e).__name__}: {str(e)}"}), 500, cors_header
