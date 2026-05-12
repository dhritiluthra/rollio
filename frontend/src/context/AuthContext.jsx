import { createContext, useContext, useState, useEffect } from "react";

// 1. Create the context — think of this as creating a global variable
const AuthContext = createContext();

// 2. Provider — wraps your entire app, makes auth data available everywhere
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // When app loads, check if user was already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  const login = (userData, userToken) => {
    // Save to state
    setUser(userData);
    setToken(userToken);

    // Save to localStorage so it persists after page refresh
    localStorage.setItem("token", userToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom hook — makes using context clean in any component
export const useAuth = () => useContext(AuthContext);
