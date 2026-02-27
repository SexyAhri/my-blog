"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ImageModal() {
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState("");

  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.closest(".post-detail-content")) {
        setSrc((target as HTMLImageElement).src);
        setVisible(true);
      }
    };

    document.addEventListener("click", handleImageClick);
    return () => document.removeEventListener("click", handleImageClick);
  }, []);

  if (!visible || !src) return null;

  return (
    <div className="image-modal" onClick={() => setVisible(false)}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 200,
        }}
      >
        <Image
          src={src}
          alt="放大图片"
          fill
          sizes="100vw"
          style={{ objectFit: "contain" }}
          unoptimized={src.startsWith("data:")}
        />
      </div>
    </div>
  );
}
