from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_registration_and_login():
    import uuid
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "SecurePassword123!"
    test_name = "Alex Mercer"

    # 1. Register
    reg_res = client.post("/auth/register", json={
        "email": test_email,
        "name": test_name,
        "password": test_password
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "token" in reg_data
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["name"] == test_name
    token = reg_data["token"]

    # 2. Get Current User via Token
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["email"] == test_email

    # 3. Duplicate Registration fails with 409
    dup_res = client.post("/auth/register", json={
        "email": test_email,
        "name": test_name,
        "password": test_password
    })
    assert dup_res.status_code == 409

    # 4. Login with correct password
    login_res = client.post("/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    assert login_res.status_code == 200
    assert "token" in login_res.json()

    # 5. Login with invalid password fails with 401
    bad_login = client.post("/auth/login", json={
        "email": test_email,
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401

def test_google_auth_endpoint():
    google_res = client.post("/auth/google", json={
        "email": "student.google@university.edu",
        "name": "Jordan Student",
        "avatar_url": "https://lh3.googleusercontent.com/a/default-user"
    })
    assert google_res.status_code == 200
    g_data = google_res.json()
    assert g_data["user"]["email"] == "student.google@university.edu"
    assert g_data["user"]["provider"] == "google"
    assert "token" in g_data
