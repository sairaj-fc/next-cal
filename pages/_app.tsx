import axios from "axios";
import Header from "comps/Header";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import "../global.css";

const Context = React.createContext(
  {} as {
    user: {
      user: any;
      isAuthenticated: boolean;
      token: string;
      logout?: () => void;
    };
    login: (data: { email: string; password: string }) => Promise<void>;
    logout: () => void;
  }
);

export const useAuth = () => React.useContext(Context);

function MyApp({ Component, pageProps }: AppProps) {
  const r = useRouter();
  const [l, sl] = useState(true);
  const [user, setUser] = useState<any>({});

  const login = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const res = await axios.post("/api/login", {
        email,
        password,
      });
      localStorage.setItem(
        "user",
        JSON.stringify({
          token: "9v2hp49uwh4c8yhbc-w89h4",
          user: res.data.user,
          isAuthenticated: true,
        })
      );
      setUser({
        isAuthenticated: true,
        user: res.data.user,
        token: "9v2hp49uwh4c8yhbc-w89h4",
      });
      r.push("/events");
    } catch (err) {
      setUser({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  };
  console.log(user);

  useEffect(() => {
    const userFromLocal = localStorage.getItem("user") || "{}";
    const thing = JSON.parse(userFromLocal);

    if (thing && thing.user) {
      console.log(1);
      setUser({
        ...thing,
      });
    } else {
      setUser({
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }

    sl(false);
  }, []);

  if (l) {
    return <div>Loading...</div>;
  }

  return (
    <Context.Provider
      value={{
        user,
        logout,
        login,
      }}
    >
      <Header />
      <Component {...pageProps} />
    </Context.Provider>
  );
}

export default MyApp;
