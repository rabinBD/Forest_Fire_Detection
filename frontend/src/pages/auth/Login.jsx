import React, { useState } from "react";
import "../../styles/Auth.css";
import { FaEnvelope, FaLock } from "react-icons/fa";
import Button from "../../components/Button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Firebase auth imports
import { signInWithCustomToken } from "firebase/auth";
import { auth, getFCMToken, requestPermission } from "../../../services/firebase"; 

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted with:", formData);
    try {
      // Step 1: Get Firebase custom token from backend
      const res = await axios.post("http://localhost:8080/api/admin/login", formData);
      console.log("Backend responded with:", res.data);

      const customToken = res.data.token;
      if (!customToken) throw new Error("No custom token received from backend");

      // Step 2: Sign in to Firebase with the custom token
      const userCredential = await signInWithCustomToken(auth, customToken);
      console.log("Firebase sign-in successful:", userCredential);

      // Step 3: Get the Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      console.log("Received Firebase ID Token:", idToken);

      // Step 4: Save ID token to localStorage
      localStorage.setItem("token", idToken);
      console.log("ID Token saved to localStorage");

      // Step 5: Save userEmail and userRole to localStorage
      const { email, role } = res.data.user;
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role);

      requestPermission();
      const fcmToken = await getFCMToken();

      console.log('FCM token: ', fcmToken);

      if (fcmToken) {
        // Step 6: Save FCM token to server (authenticated)
        await axios.post(
          "http://localhost:8080/api/notify/save-token",
          { token: fcmToken },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json"
            }
          }
        );
      }


      alert("Login successful");
      navigate("/dashboard2");
    } catch (error) {
      console.error("Login error:", error);
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="form-container">
          <h1 className="logo">FireGuard</h1>
          <h2>Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <i>
                <FaEnvelope />
              </i>
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <i>
                <FaLock />
              </i>
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                onChange={handleChange}
              />
            </div>
            <Button className="button" type="submit">
              Login
            </Button>
            <p className="message">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
