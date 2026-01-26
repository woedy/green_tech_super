#!/usr/bin/env python3
"""
Quick test script to verify authentication is working
Run this after starting the Django server
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_authentication():
    print("🔐 Testing Green Tech Africa Authentication")
    print("=" * 50)
    
    # Test admin login
    print("\n1. Testing Admin Login...")
    admin_response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "admin@greentech.africa",
        "password": "admin123"
    })
    
    if admin_response.status_code == 200:
        admin_data = admin_response.json()
        print("✅ Admin login successful!")
        print(f"   User: {admin_data['user']['first_name']} {admin_data['user']['last_name']}")
        print(f"   Role: {admin_data['user']['user_type']}")
        print(f"   Verified: {admin_data['user']['is_verified']}")
        
        # Test admin profile access
        admin_token = admin_data['access']
        profile_response = requests.get(f"{BASE_URL}/auth/profile/", 
                                      headers={"Authorization": f"Bearer {admin_token}"})
        if profile_response.status_code == 200:
            print("✅ Admin profile access successful!")
        else:
            print("❌ Admin profile access failed!")
    else:
        print(f"❌ Admin login failed: {admin_response.status_code}")
        print(f"   Response: {admin_response.text}")
    
    # Test agent login
    print("\n2. Testing Agent Login...")
    agent_response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "agent@greentech.africa",
        "password": "agent123"
    })
    
    if agent_response.status_code == 200:
        agent_data = agent_response.json()
        print("✅ Agent login successful!")
        print(f"   User: {agent_data['user']['first_name']} {agent_data['user']['last_name']}")
        print(f"   Role: {agent_data['user']['user_type']}")
        print(f"   Phone: {agent_data['user'].get('phone_number', 'N/A')}")
        
        # Test agent profile access
        agent_token = agent_data['access']
        profile_response = requests.get(f"{BASE_URL}/auth/profile/", 
                                      headers={"Authorization": f"Bearer {agent_token}"})
        if profile_response.status_code == 200:
            print("✅ Agent profile access successful!")
        else:
            print("❌ Agent profile access failed!")
    else:
        print(f"❌ Agent login failed: {agent_response.status_code}")
        print(f"   Response: {agent_response.text}")
    
    # Test builder login
    print("\n3. Testing Builder Login...")
    builder_response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "builder@greentech.africa",
        "password": "builder123"
    })
    
    if builder_response.status_code == 200:
        builder_data = builder_response.json()
        print("✅ Builder login successful!")
        print(f"   User: {builder_data['user']['first_name']} {builder_data['user']['last_name']}")
        print(f"   Role: {builder_data['user']['user_type']}")
    else:
        print(f"❌ Builder login failed: {builder_response.status_code}")
        print(f"   Response: {builder_response.text}")
    
    # Test invalid login
    print("\n4. Testing Invalid Login...")
    invalid_response = requests.post(f"{BASE_URL}/auth/login/", json={
        "email": "invalid@example.com",
        "password": "wrongpassword"
    })
    
    if invalid_response.status_code == 401:
        print("✅ Invalid login correctly rejected!")
    else:
        print(f"❌ Invalid login should return 401, got: {invalid_response.status_code}")
    
    # Test registration
    print("\n5. Testing Agent Registration...")
    register_response = requests.post(f"{BASE_URL}/auth/register/", json={
        "email": "newagent@greentech.africa",
        "password": "newagent123",
        "confirm_password": "newagent123",
        "first_name": "New",
        "last_name": "Agent",
        "phone_number": "+233 24 999 8888",
        "user_type": "AGENT"
    })
    
    if register_response.status_code == 201:
        print("✅ Agent registration successful!")
        print("   User needs to verify email before login")
    else:
        print(f"❌ Agent registration failed: {register_response.status_code}")
        print(f"   Response: {register_response.text}")
    
    print("\n" + "=" * 50)
    print("🎉 Authentication test completed!")
    print("\nDemo Credentials:")
    print("Admin:   admin@greentech.africa / admin123")
    print("Agent:   agent@greentech.africa / agent123") 
    print("Builder: builder@greentech.africa / builder123")

if __name__ == "__main__":
    try:
        test_authentication()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Django server!")
        print("Make sure the Django server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")