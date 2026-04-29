import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";

const storageKey = "wizack-theme";

const initTheme = () => {
  const root = document.documentElement;
  const saved = window.localStorage.getItem(storageKey);
  const theme = saved === "dark" || saved === "light" ? saved : "dark";
  root.classList.remove("light", "dark");
  root.classList.add(theme);
};

initTheme();

const initGoogleSearchConsole = () => {
  const token = String((import.meta as any).env?.VITE_GSC_VERIFICATION ?? "").trim();
  if (!token) return;
  const head = document.head;
  if (!head) return;
  const name = "google-site-verification";
  const existing = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  const meta = existing ?? document.createElement("meta");
  meta.setAttribute("name", name);
  meta.setAttribute("content", token);
  if (!existing) head.appendChild(meta);
};

initGoogleSearchConsole();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
