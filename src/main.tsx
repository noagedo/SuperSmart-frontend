import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import ThemeProvider from "./Theme.tsx"; 
import { GoogleOAuthProvider } from "@react-oauth/google";


const GOOGLE_CLIENT_ID = "282222794573-ck2v9clpo95rrb2pd3r49k3l1vncsd30.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
