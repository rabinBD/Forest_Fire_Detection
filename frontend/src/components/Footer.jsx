import React from "react";
import "../styles/Footer.css";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-about">
          <a href="#home">
            <h2>FireGuard</h2>
          </a>
          <p>
            An IoT-based forest fire detection system powered by TinyML. Built
            by Computer Engineering students of Pokhara University to protect
            forests, wildlife, and lives.
          </p>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>
          <ul>
            <a href="#home">
              <li>Home</li>
            </a>
            <a href="#about">
              <li>About</li>
            </a>
            <a href="#features">
              <li>Features</li>
            </a>
            <a href="#contact">
              <li>Contact</li>
            </a>
          </ul>
        </div>

        <div className="footer-social">
          <h3>Follow Us On</h3>
          <div className="social-icons">
            <span>
              <FaXTwitter />
            </span>
            <span>
              <FaFacebookF />
            </span>
            <span>
              <FaLinkedinIn />
            </span>
          </div>
        </div>
      </div>

      <hr />
      <p className="footer-bottom">
        © 2025 <strong>FireGuard Project</strong>. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
