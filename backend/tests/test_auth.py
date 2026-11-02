"""Test authentication, default admin, and worker signup/login."""

from fastapi import status


def test_default_admin_login(client):
    response = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "admin"
    assert "token" in data


def test_admin_login_wrong_password(client):
    response = client.post("/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid username or password" in response.json()["detail"]


def test_login_nonexistent_user(client):
    response = client.post("/auth/login", json={"username": "ghost", "password": "any"})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_worker_signup_and_login(client):
    signup_data = {
        "username": "delivery_rohit",
        "password": "mypassword123",
        "full_name": "Rohit Kumar",
        "city": "Mumbai",
        "platform": "Zomato",
        "average_daily_income": "900.00",
        "experience_days": 180,
    }
    # 1. Signup
    signup_res = client.post("/auth/signup", json=signup_data)
    assert signup_res.status_code == status.HTTP_201_CREATED
    data = signup_res.json()
    assert data["user"]["username"] == "delivery_rohit"
    assert data["user"]["role"] == "worker"
    assert data["worker"] is not None
    assert data["worker"]["full_name"] == "Rohit Kumar"
    assert data["worker"]["platform"] == "Zomato"

    # 2. Duplicate username fails
    dup_res = client.post("/auth/signup", json=signup_data)
    assert dup_res.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Login with newly created worker credentials
    login_res = client.post(
        "/auth/login",
        json={"username": "delivery_rohit", "password": "mypassword123"},
    )
    assert login_res.status_code == status.HTTP_200_OK
    login_data = login_res.json()
    assert login_data["user"]["role"] == "worker"
    assert login_data["worker"]["id"] == data["worker"]["id"]
