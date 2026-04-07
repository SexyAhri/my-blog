"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Input, Switch } from "antd";
import {
  CloseOutlined,
  MenuOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/providers";

export default function BlogHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const { themeMode, setThemeMode } = useTheme();
  const switchRef = useRef<HTMLSpanElement>(null);

  const handleSearch = () => {
    if (!searchValue.trim()) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(searchValue)}`);
    setSearchValue("");
  };

  function createRipple(x: number, y: number, toLight: boolean) {
    const rippleContainer = document.createElement("div");
    rippleContainer.className = "theme-ripple-container";
    rippleContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 99999;
      overflow: hidden;
    `;

    const rippleColor = toLight
      ? "rgba(79, 110, 247, 0.6)"
      : "rgba(255, 255, 255, 0.5)";

    for (let i = 0; i < 3; i += 1) {
      const ripple = document.createElement("div");
      ripple.className = "theme-ripple";
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        border: 3px solid ${rippleColor};
        box-shadow: 0 0 10px ${rippleColor};
        animation: ripple-wave 0.8s ease-out forwards;
        animation-delay: ${i * 0.12}s;
      `;
      rippleContainer.appendChild(ripple);
    }

    document.body.appendChild(rippleContainer);
    setTimeout(() => rippleContainer.remove(), 1200);
  }

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    const toLight = !checked;

    const switchEl = switchRef.current;
    const rect = switchEl?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : 0;

    createRipple(x, y, toLight);

    if (!document.startViewTransition) {
      setThemeMode(newTheme);
      return;
    }

    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    document.documentElement.style.setProperty("--theme-x", `${x}px`);
    document.documentElement.style.setProperty("--theme-y", `${y}px`);
    document.documentElement.style.setProperty("--theme-r", `${maxRadius}px`);

    document.startViewTransition(() => {
      setThemeMode(newTheme);
    });
  };

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
    { label: "Archive", href: "/archive" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="blog-header">
      <div className="blog-header-container">
        <Link href="/" className="blog-logo">
          <span className="blog-logo-text">VixenAhri</span>
        </Link>

        <nav className="blog-nav desktop-nav">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="blog-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="blog-header-actions">
          <div className="blog-search">
            <Input
              placeholder="Search posts..."
              prefix={<SearchOutlined style={{ color: "var(--blog-text-muted)" }} />}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onPressEnter={handleSearch}
            />
          </div>
          <span ref={switchRef} className="blog-theme-toggle-wrap">
            <Switch
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              checked={themeMode === "dark"}
              onChange={handleThemeChange}
              aria-label={
                themeMode === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            />
          </span>
        </div>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          aria-label="Menu"
        >
          {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="blog-nav mobile-nav">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="blog-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
