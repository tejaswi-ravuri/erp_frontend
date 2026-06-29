import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "@/api/authApi";

// ── Helpers ──────────────────────────────────────────────────────────────────

function persistSession({ user, accessToken, refreshToken }) {
  localStorage.setItem("mm_access_token", accessToken);
  localStorage.setItem("mm_refresh_token", refreshToken);
  localStorage.setItem("mm_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("mm_access_token");
  localStorage.removeItem("mm_refresh_token");
  localStorage.removeItem("mm_user");
  localStorage.removeItem("mm_erp_role");
}

function hydrateUser() {
  try {
    const raw = localStorage.getItem("mm_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Thunks ───────────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    console.log("thunk value---", email, password);
    try {
      const result = await authApi.login(email, password);
      console.log(result);
      persistSession(result);
      return result.user;
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed";
      return rejectWithValue(message);
    }
  },
);

export const fetchMeThunk = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.me();
    } catch (err) {
      return rejectWithValue("Session expired");
    }
  },
);

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await authApi.logout();
  clearSession();
});

// ── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: hydrateUser(), // hydrate from localStorage on first load
    isAuthenticated: !!localStorage.getItem("mm_access_token"),
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    // Called externally when token refresh fails (http.js interceptor)
    forceLogout(state) {
      state.user = null;
      state.isAuthenticated = false;
      clearSession();
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchMe
    builder
      .addCase(fetchMeThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        clearSession();
      });

    // logout
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError, forceLogout } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
