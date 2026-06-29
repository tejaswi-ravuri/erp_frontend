import React, { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMeThunk,
  logoutThunk,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from "@/store/authSlice";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  // On mount: if we have a stored token, verify it is still valid
  //uncomment when using login
  useEffect(() => {
    const token = localStorage.getItem("mm_access_token");
    if (token) {
      dispatch(fetchMeThunk());
    }
  }, [dispatch]);

  const logout = () => {
    dispatch(logoutThunk());
  };

  // Kept for backward compat — now just redirects to "/" (role login)
  const navigateToLogin = () => {
    window.location.href = "/";
  };

  // isLoadingAuth / isLoadingPublicSettings used by App.jsx
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth: isLoading,
        isLoadingPublicSettings: false, // no longer needed
        authError,
        appPublicSettings: null, // no longer needed
        authChecked: !isLoading,
        logout,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
