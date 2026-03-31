import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - VixenAhri Blog",
  description:
    "Learn what data VixenAhri Blog collects, how it is used, and how visitor privacy is protected.",
};

export default function PrivacyPage() {
  return (
    <div className="blog-container">
      <div className="about-page">
        <h1>Privacy Policy</h1>
        <p className="privacy-update">Last updated: March 12, 2026</p>

        <section className="about-section">
          <h2>Overview</h2>
          <p>
            This page explains what information VixenAhri Blog may collect, how
            it is used, and how that information is protected when you browse
            the site.
          </p>
        </section>

        <section className="about-section">
          <h2>Information We Collect</h2>
          <p>The site may collect the following types of information:</p>
          <ul className="privacy-list">
            <li>
              <strong>Usage data:</strong> browser type, IP address, visited
              pages, visit time, and related analytics signals.
            </li>
            <li>
              <strong>Comment data:</strong> the name, email, and comment
              content you submit when leaving a comment on a post.
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Cookies</h2>
          <p>
            Cookies and similar technologies may be used to remember
            preferences, improve performance, and support analytics.
          </p>
          <ul className="privacy-list">
            <li>Measure traffic and reading behavior.</li>
            <li>Remember display preferences.</li>
            <li>Improve the browsing experience.</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Analytics</h2>
          <p>
            The site may use analytics tools such as Google Analytics to better
            understand how visitors use the site. These tools can collect
            aggregate, non-personal browsing information.
          </p>
          <p>
            For more details, review the{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Privacy Policy
            </a>
            .
          </p>
        </section>

        <section className="about-section">
          <h2>Data Security</h2>
          <p>
            Reasonable technical and organizational steps are taken to protect
            stored information. No internet transmission or storage method can
            be guaranteed to be completely secure.
          </p>
        </section>

        <section className="about-section">
          <h2>Third-Party Links</h2>
          <p>
            Some pages may include links to third-party sites. Their privacy
            practices are controlled by those sites, not by this blog.
          </p>
        </section>

        <section className="about-section">
          <h2>Policy Updates</h2>
          <p>
            This policy may be updated from time to time. When changes are
            published here, the &quot;Last updated&quot; date will also be
            revised.
          </p>
        </section>

        <section className="about-section">
          <h2>Contact</h2>
          <p>
            If you have questions about this privacy policy, you can reach out
            at:
          </p>
          <ul className="about-contact">
            <li>
              <strong>Email:</strong>{" "}
              <a href="mailto:contact@vixenahri.cn">contact@vixenahri.cn</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
