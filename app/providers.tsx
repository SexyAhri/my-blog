"use client";

import { ConfigProvider, theme, App } from "antd";
import zhCN from "antd/locale/zh_CN";
import { SessionProvider } from "next-auth/react";
import { useState, ReactNode, createContext, useContext, useEffect } from "react";
import { GlobalModal } from "@/components/common/GlobalModal";

type ThemeMode = "light" | "dark";

const ThemeContext = createContext<{
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}>({
  themeMode: "light",
  setThemeMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function ThemeSync({ themeMode }: { themeMode: ThemeMode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    try {
      const saved = localStorage.getItem("blog-theme");
      return saved === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("blog-theme", themeMode);
    } catch {}
  }, [themeMode]);

  const lightTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: "#4f6ef7",
      colorBgContainer: "#f8f9fa",
      colorBgLayout: "#eef0f2",
      colorBgElevated: "#ffffff",
      colorBorder: "#dcdfe3",
      colorBorderSecondary: "#e8eaed",
      colorText: "#2c3e50",
      colorTextSecondary: "#5a6d82",
      colorTextTertiary: "#8492a6",
      borderRadius: 8,
    },
    components: {
      Card: {
        colorBgContainer: "#f8f9fa",
      },
      Table: {
        colorBgContainer: "#f8f9fa",
        headerBg: "#f0f2f4",
      },
      Layout: {
        siderBg: "#1e2a3a",
      },
    },
  };

  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: "#5a7bf9",
      colorBgContainer: "#1e2128",
      colorBgLayout: "#16181d",
      colorBgElevated: "#252830",
      colorBorder: "#363940",
      colorBorderSecondary: "#2d3038",
      colorText: "#e8e9eb",
      colorTextSecondary: "#a8abb2",
      colorTextTertiary: "#73767d",
      borderRadius: 8,
    },
    components: {
      Card: {
        colorBgContainer: "#1e2128",
      },
      Table: {
        colorBgContainer: "#1e2128",
        headerBg: "#252830",
      },
      Layout: {
        siderBg: "#12141a",
      },
    },
  };

  return (
    <SessionProvider>
      <ConfigProvider
        locale={zhCN}
        theme={themeMode === "dark" ? darkTheme : lightTheme}
      >
        <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
          <ThemeSync themeMode={themeMode} />
          <App>
            {children}
            <GlobalModal />
          </App>
        </ThemeContext.Provider>
      </ConfigProvider>
    </SessionProvider>
  );
}
