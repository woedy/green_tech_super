import React from "react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { AuthContext, AuthUser, Role } from "@/contexts/AuthContext";

const noop = async () => {};

type AuthValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: typeof noop;
  register: typeof noop;
  logout: () => void;
};

const renderWithAuth = (authValue: AuthValue, initialPath = "/account") =>
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <div>Private</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to /auth/login", () => {
    renderWithAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: noop,
      register: noop,
      logout: () => {},
    });

    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    renderWithAuth({
      user: {
        id: 1,
        email: "test@example.com",
        user_type: "CUSTOMER" as Role,
        is_verified: true,
      },
      isAuthenticated: true,
      isLoading: false,
      login: noop,
      register: noop,
      logout: () => {},
    });

    expect(screen.getByText("Private")).toBeInTheDocument();
  });
});
