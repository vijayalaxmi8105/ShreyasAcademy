import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import App from "./src/App";
import SignUp from "./src/pages/SignUp";
import Login from "./src/pages/Login";
import Mentors from "./src/pages/Mentors";
import Dashboard from "./src/pages/Dashboard";


// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/profile", {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  // Loading state
  if (isLoggedIn === null) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Router configuration
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/mentors",
    element: <Mentors />,
  },
]);