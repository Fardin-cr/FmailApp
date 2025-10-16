import requests
import json
from flask import Flask, request, jsonify

# Define the actual target API endpoint
TARGET_API_URL = "https://api.firstmail.ltd/v1/mail/change/password"

def change_password_proxy(request):
    """
    Acts as a CORS-bypassing proxy for the FirstMail API.
    Handles OPTIONS request for CORS pre-flight and POST request for the password change.
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
        return ('', 204, headers)

    # 2. Handle POST request for the actual password change
    # Set the default CORS header for the response
    cors_header = {'Access-Control-Allow-Origin': '*'}

    try:
        # Check Content-Type and parse JSON
        if request.content_type != 'application/json':
            raise ValueError(f"Unsupported Content-Type: {request.content_type}. Expected application/json.")

        request_json = request.get_json(silent=True)
        if request_json is None:
            raise ValueError("Invalid JSON in request body.")

        # Extract data sent from the web app
        mail = request_json.get('username')
        cpass = request_json.get('cpassword')
        npass = request_json.get('npassword')
        api_key = request_json.get('api_key') # This is the X-API-KEY value

        # Validate required fields
        if not all([mail, cpass, npass, api_key]):
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
        result_json = response.json()
        
        # Include the necessary CORS header in the final response
        return jsonify(result_json), response.status_code, cors_header

    except requests.exceptions.RequestException as e:
        # Handle errors during the external API call
        return jsonify({"error": f"Proxy failed to reach target API: {str(e)}"}), 502, cors_header
    except Exception as e:
        # Handle other internal errors (like JSON parsing issues)
        return jsonify({"error": f"Internal proxy error: {str(e)}"}), 500, cors_header

