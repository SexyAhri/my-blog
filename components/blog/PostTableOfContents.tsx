"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function PostTableOfContents({ toc }: { toc: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll(
        ".post-detail-content h1, .post-detail-content h2, .post-detail-content h3",
      );
      let currentId = "";
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = heading.id;
        }
      });
      setActiveId(currentId);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 80, behavior: "smooth" });
    }
  };

  if (toc.length === 0) return null;

  return (
    <aside className="post-toc">
      <div className="post-toc-title">目录</div>
      <nav className="post-toc-nav">
        {toc.map((item) => (
          <a
            key={item.id}
            className={`post-toc-item post-toc-level-${item.level} ${activeId === item.id ? "active" : ""}`}
            onClick={() => scrollToHeading(item.id)}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
