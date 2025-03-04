#!/usr/bin/env python
"""
Simple script to test connection to the remote API.
Run this script to check if the remote API is accessible.
"""
import os
import sys
import asyncio
import httpx
import socket
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

async def test_connection():
    """Test connection to the remote API"""
    remote_url = os.getenv("REMOTE_API_URL")
    if not remote_url:
        print("ERROR: REMOTE_API_URL environment variable is not set")
        sys.exit(1)
    
    print(f"Testing connection to remote API: {remote_url}")
    
    # Test base URL connection
    try:
        async with httpx.AsyncClient(timeout=10.0, verify=False) as client:
            print(f"Testing connection to base URL: {remote_url}")
            try:
                response = await client.get(remote_url)
                print(f"Base URL connection successful: {response.status_code}")
            except Exception as e:
                print(f"Failed to connect to base URL: {str(e)}")
    except Exception as e:
        print(f"Error creating client: {str(e)}")
    
    # Test specific endpoint
    try:
        async with httpx.AsyncClient(base_url=remote_url, timeout=10.0, verify=False) as client:
            endpoint = "/v1/tools/convert_pdf2text"
            print(f"Testing connection to endpoint: {remote_url}{endpoint}")
            try:
                response = await client.head(endpoint)
                print(f"Endpoint connection successful: {response.status_code}")
            except Exception as e:
                print(f"Failed to connect to endpoint: {str(e)}")
    except Exception as e:
        print(f"Error creating client for endpoint test: {str(e)}")
    
    # Network diagnostics
    print("\nNetwork diagnostics:")
    try:
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)
        print(f"Hostname: {hostname}, IP: {ip_address}")
    except Exception as e:
        print(f"Failed to get network info: {str(e)}")
    
    # Direct socket connection
    try:
        parsed_url = urlparse(remote_url)
        host = parsed_url.hostname
        port = parsed_url.port or 80
        
        print(f"Testing direct socket connection to {host}:{port}")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f"Socket connection successful to {host}:{port}")
        else:
            print(f"Socket connection failed to {host}:{port} with error code {result}")
        sock.close()
    except Exception as e:
        print(f"Socket connection test failed: {str(e)}")
    
    # Try ping
    print("\nPinging host:")
    try:
        import subprocess
        ping_count = "4" if sys.platform != "win32" else "4"
        ping_cmd = ["ping", "-c" if sys.platform != "win32" else "-n", ping_count, host]
        print(f"Running: {' '.join(ping_cmd)}")
        result = subprocess.run(ping_cmd, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"Ping stderr: {result.stderr}")
    except Exception as e:
        print(f"Ping test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_connection()) 