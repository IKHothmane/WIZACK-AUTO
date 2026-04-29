import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";

const storageKey = "wizack-theme";

const initTheme = () => {
  const root = document.documentElement;
  const saved = window.localStorage.getItem(storageKey);
  const theme = saved === "dark" || saved === "light" ? saved : "light";
  root.classList.remove("light", "dark");
  root.classList.add(theme);
};

initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
