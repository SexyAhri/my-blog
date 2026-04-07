import Link from "next/link";
import {
  GithubOutlined,
  MailOutlined,
  TwitterOutlined,
  WeiboOutlined,
} from "@ant-design/icons";
import { getPublicSiteSettings } from "@/lib/public-settings";

const FOOTER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/feed.xml", label: "RSS" },
];

export default async function BlogFooter() {
  const currentYear = new Date().getFullYear();
  const {
    socialGithub,
    socialTwitter,
    socialWeibo,
    socialEmail,
    siteIcp,
  } = await getPublicSiteSettings();

  return (
    <footer className="blog-footer">
      <div className="blog-footer-container">
        <div className="blog-footer-content">
          <div className="blog-footer-section">
            <p>&copy; {currentYear} VixenAhri</p>
            {siteIcp && (
              <p style={{ fontSize: 12, marginTop: 4 }}>
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#999" }}
                >
                  {siteIcp}
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
              {socialGithub && (
                <a
                  href={socialGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <GithubOutlined />
                </a>
              )}
              {socialTwitter && (
                <a
                  href={socialTwitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <TwitterOutlined />
                </a>
              )}
              {socialWeibo && (
                <a
                  href={socialWeibo}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Weibo"
                >
                  <WeiboOutlined />
                </a>
              )}
              {socialEmail && (
                <a href={`mailto:${socialEmail}`} aria-label="Email">
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
