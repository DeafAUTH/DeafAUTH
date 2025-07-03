import requests
import json

# Assume DEAF_AUTH_API_URL is the endpoint for your Deaf Auth system
DEAF_AUTH_API_URL = "https://www.deafauth.pinksync.io/api/v1/auth/login" # Replace with actual URL

def authenticate_with_deaf_auth(username, password, other_params=None):
    """
    Authenticates a user against the Deaf Auth system.

    Args:
        username (str): The user's username.
        password (str): The user's password.
        other_params (dict, optional): Any other parameters required by Deaf Auth.

    Returns:
        dict: The response from the auth server (e.g., a token, user info) on success.
        None: If authentication fails or an error occurs.
    """
    payload = {
        "username": username,
        "password": password
        # Add any other required fields for Deaf Auth
        # e.g., "client_id": "your_client_id",
        # "grant_type": "password",
    }
    if other_params:
        payload.update(other_params)

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
        # Add any other required headers, like an API key for the service itself
        # "X-API-Key": "your_service_api_key"
    }

    try:
        response = requests.post(DEAF_AUTH_API_URL, data=json.dumps(payload), headers=headers, timeout=10)
        response.raise_for_status() # Raises an HTTPError for bad responses (4XX or 5XX)

        # Assuming the server returns JSON with a token upon success
        auth_data = response.json()
        print("Authentication successful!")
        return auth_data # e.g., {"access_token": "...", "user_id": "..."}

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        print(f"Response content: {response.content}")
        # You might want to parse response.json() here for specific error messages
        # if the API returns structured errors
        return None
    except requests.exceptions.ConnectionError as conn_err:
        print(f"Connection error occurred: {conn_err}")
        return None
    except requests.exceptions.Timeout as timeout_err:
        print(f"Timeout error occurred: {timeout_err}")
        return None
    except requests.exceptions.RequestException as req_err:
        print(f"An error occurred: {req_err}")
        return None