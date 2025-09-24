import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

const AUTH_KEY = "gta_auth";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("redirects unauthenticated users to /auth/login", () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/account"]}>
          <Routes>
            <Route path="/account" element={<ProtectedRoute><div>Private</div></ProtectedRoute>} />
            <Route path="/auth/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    // Set a demo auth user
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ id: "1", email: "test@example.com", name: "Test User" })
    );

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/account"]}>
          <Routes>
            <Route path="/account" element={<ProtectedRoute><div>Private</div></ProtectedRoute>} />
            <Route path="/auth/login" element={<div>Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText("Private")).toBeInTheDocument();
  });
});
