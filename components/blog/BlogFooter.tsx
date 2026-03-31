"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GithubOutlined,
  MailOutlined,
  TwitterOutlined,
  WeiboOutlined,
} from "@ant-design/icons";

interface SocialLinks {
  github?: string;
  twitter?: string;
  weibo?: string;
  email?: string;
}

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/feed.xml", label: "RSS" },
];

export default function BlogFooter() {
  const currentYear = new Date().getFullYear();
  const [social, setSocial] = useState<SocialLinks>({});
  const [icp, setIcp] = useState("");

  useEffect(() => {
    fetch("/api/settings/footer")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSocial({
            github: data.socialGithub,
            twitter: data.socialTwitter,
            weibo: data.socialWeibo,
            email: data.socialEmail,
          });
          setIcp(data.siteIcp || "");
        }
      })
      .catch(console.error);
  }, []);

  return (
    <footer className="blog-footer">
      <div className="blog-footer-container">
        <div className="blog-footer-content">
          <div className="blog-footer-section">
            <p>© {currentYear} VixenAhri</p>
            {icp && (
              <p style={{ fontSize: 12, marginTop: 4 }}>
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#999" }}
                >
                  {icp}
                </a>
              </p>
            )}
          </div>

          <div className="blog-footer-section">
            <ul>
              {FOOTER_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="blog-footer-section">
            <div className="blog-footer-social">
              {social.github && (
                <a
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <GithubOutlined />
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <TwitterOutlined />
                </a>
              )}
              {social.weibo && (
                <a
                  href={social.weibo}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Weibo"
                >
                  <WeiboOutlined />
                </a>
              )}
              {social.email && (
                <a href={`mailto:${social.email}`} aria-label="Email">
                  <MailOutlined />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
