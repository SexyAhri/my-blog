import { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 - VixenAhri Blog",
  description: "VixenAhri Blog 的隐私政策，说明我们如何收集和使用您的信息。",
};

export default function PrivacyPage() {
  return (
    <div className="blog-container">
      <div className="about-page">
        <h1>隐私政策</h1>
        <p className="privacy-update">最后更新：2026年1月22日</p>

        <section className="about-section">
          <h2>概述</h2>
          <p>
            欢迎访问 VixenAhri Blog（以下简称"本站"）。本隐私政策说明了我们如何收集、使用和保护您的个人信息。
            访问本站即表示您同意本隐私政策的条款。
          </p>
        </section>

        <section className="about-section">
          <h2>信息收集</h2>
          <p>本站可能收集以下类型的信息：</p>
          <ul className="privacy-list">
            <li>
              <strong>自动收集的信息：</strong>
              当您访问本站时，我们可能会自动收集某些信息，包括您的 IP 地址、浏览器类型、
              访问时间、浏览的页面等。这些信息通过 Google Analytics 收集，用于分析网站流量和改善用户体验。
            </li>
            <li>
              <strong>评论信息：</strong>
              如果您在文章下方发表评论，我们会收集您提供的昵称、邮箱和评论内容。
              邮箱仅用于显示头像（通过 Gravatar），不会公开显示或用于其他目的。
            </li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Cookie 使用</h2>
          <p>
            本站使用 Cookie 和类似技术来：
          </p>
          <ul className="privacy-list">
            <li>分析网站流量和用户行为（Google Analytics）</li>
            <li>记住您的偏好设置</li>
            <li>提供更好的用户体验</li>
          </ul>
          <p>
            您可以通过浏览器设置禁用 Cookie，但这可能会影响网站的某些功能。
          </p>
        </section>

        <section className="about-section">
          <h2>Google Analytics</h2>
          <p>
            本站使用 Google Analytics 来分析网站流量。Google Analytics 会收集匿名的使用数据，
            帮助我们了解访客如何使用本站。这些数据包括：
          </p>
          <ul className="privacy-list">
            <li>访问的页面</li>
            <li>在网站上花费的时间</li>
            <li>访问来源</li>
            <li>使用的设备和浏览器</li>
          </ul>
          <p>
            如需了解更多关于 Google 如何使用数据，请访问{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 隐私政策
            </a>
            。
          </p>
        </section>

        <section className="about-section">
          <h2>信息安全</h2>
          <p>
            我们采取合理的技术和组织措施来保护您的个人信息，防止未经授权的访问、使用或泄露。
            但请注意，互联网传输不能保证100%安全。
          </p>
        </section>

        <section className="about-section">
          <h2>第三方链接</h2>
          <p>
            本站可能包含指向第三方网站的链接。我们对这些网站的隐私政策不承担责任，
            建议您在访问这些网站时查阅其隐私政策。
          </p>
        </section>

        <section className="about-section">
          <h2>政策更新</h2>
          <p>
            我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并更新"最后更新"日期。
            建议您定期查看本页面以了解任何变更。
          </p>
        </section>

        <section className="about-section">
          <h2>联系我们</h2>
          <p>
            如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
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
