import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind CSS 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 常见中文词汇翻译映射
const chineseToEnglish: Record<string, string> = {
  // 通用词汇
  "入门": "getting-started",
  "教程": "tutorial",
  "指南": "guide",
  "文档": "docs",
  "介绍": "introduction",
  "简介": "intro",
  "基础": "basics",
  "进阶": "advanced",
  "高级": "advanced",
  "实战": "practice",
  "项目": "project",
  "示例": "example",
  "案例": "case-study",
  "总结": "summary",
  "笔记": "notes",
  "学习": "learning",
  "心得": "experience",
  "分享": "sharing",
  "记录": "record",
  "日志": "log",
  "周报": "weekly",
  "月报": "monthly",
  "年度": "yearly",
  "回顾": "review",
  "展望": "outlook",
  
  // 开发相关
  "开发": "development",
  "部署": "deployment",
  "配置": "config",
  "安装": "installation",
  "使用": "usage",
  "搭建": "setup",
  "构建": "build",
  "编译": "compile",
  "打包": "bundle",
  "发布": "release",
  "版本": "version",
  "更新": "update",
  "升级": "upgrade",
  "迁移": "migration",
  "重构": "refactor",
  "测试": "testing",
  "单元测试": "unit-test",
  "集成测试": "integration-test",
  "端到端测试": "e2e-test",
  "调试": "debugging",
  "排错": "troubleshooting",
  "优化": "optimization",
  "性能": "performance",
  "安全": "security",
  "认证": "authentication",
  "授权": "authorization",
  "加密": "encryption",
  "解密": "decryption",
  
  // 最佳实践
  "最佳实践": "best-practices",
  "常见问题": "faq",
  "问题": "issues",
  "解决方案": "solutions",
  "技巧": "tips",
  "窍门": "tricks",
  "经验": "experience",
  "踩坑": "pitfalls",
  "避坑": "avoid-pitfalls",
  "注意事项": "notes",
  
  // 技术栈
  "工具": "tools",
  "插件": "plugins",
  "扩展": "extensions",
  "组件": "components",
  "模块": "modules",
  "库": "library",
  "框架": "framework",
  "函数": "functions",
  "方法": "methods",
  "类": "class",
  "对象": "object",
  "数组": "array",
  "字符串": "string",
  "变量": "variables",
  "常量": "constants",
  "接口": "api",
  "路由": "routing",
  "中间件": "middleware",
  "钩子": "hooks",
  "状态": "state",
  "状态管理": "state-management",
  "生命周期": "lifecycle",
  "事件": "events",
  "监听": "listener",
  "回调": "callback",
  "异步": "async",
  "同步": "sync",
  "并发": "concurrency",
  "多线程": "multithreading",
  
  // 数据相关
  "数据": "data",
  "数据库": "database",
  "缓存": "cache",
  "存储": "storage",
  "文件": "file",
  "上传": "upload",
  "下载": "download",
  "导入": "import",
  "导出": "export",
  "备份": "backup",
  "恢复": "restore",
  "增删改查": "crud",
  "查询": "query",
  "搜索": "search",
  "过滤": "filter",
  "排序": "sort",
  "分页": "pagination",
  
  // 架构相关
  "服务器": "server",
  "客户端": "client",
  "前端": "frontend",
  "后端": "backend",
  "全栈": "fullstack",
  "移动端": "mobile",
  "桌面端": "desktop",
  "桌面": "desktop",
  "网页": "web",
  "小程序": "miniprogram",
  "应用": "app",
  "系统": "system",
  "架构": "architecture",
  "微服务": "microservices",
  "单体": "monolithic",
  "分布式": "distributed",
  "集群": "cluster",
  "负载均衡": "load-balancing",
  "高可用": "high-availability",
  "容灾": "disaster-recovery",
  
  // 设计相关
  "设计": "design",
  "模式": "pattern",
  "设计模式": "design-patterns",
  "原理": "principle",
  "源码": "source-code",
  "分析": "analysis",
  "详解": "explained",
  "深入": "deep-dive",
  "浅谈": "overview",
  "理解": "understanding",
  "探索": "exploring",
  "揭秘": "demystified",
  
  // 网络相关
  "网络": "network",
  "协议": "protocol",
  "请求": "request",
  "响应": "response",
  "代理": "proxy",
  "反向代理": "reverse-proxy",
  "内网穿透": "intranet-tunnel",
  "隧道": "tunnel",
  "域名": "domain",
  "证书": "certificate",
  "跨域": "cors",
  
  // 容器化
  "容器": "container",
  "镜像": "image",
  "编排": "orchestration",
  "虚拟化": "virtualization",
  "云原生": "cloud-native",
  "云服务": "cloud-service",
  "云计算": "cloud-computing",
  
  // DevOps
  "持续集成": "ci",
  "持续部署": "cd",
  "自动化": "automation",
  "监控": "monitoring",
  "告警": "alerting",
  "日志管理": "log-management",
  "运维": "devops",
  
  // UI/UX
  "界面": "ui",
  "交互": "interaction",
  "用户体验": "ux",
  "响应式": "responsive",
  "自适应": "adaptive",
  "动画": "animation",
  "过渡": "transition",
  "主题": "theme",
  "暗黑模式": "dark-mode",
  "样式": "styles",
  "布局": "layout",
  
  // 常用短语
  "从零开始": "from-scratch",
  "快速上手": "quick-start",
  "完全指南": "complete-guide",
  "终极指南": "ultimate-guide",
  "一文搞懂": "explained",
  "手把手": "step-by-step",
  "实现原理": "implementation",
  "工作原理": "how-it-works",
  "使用详解": "usage-guide",
  "全面解析": "comprehensive-guide",
  "深度解析": "in-depth",
  "源码解读": "source-code-analysis",
  "面试题": "interview",
  "面试": "interview",
  "算法": "algorithm",
  "数据结构": "data-structure",

  // ========== content 系列文章标签/分类补充 ==========
  // 系列名（分类用）
  "技术": "tech",
  "生活": "life",

  // Next.js / React / Vue 系列常用
  "国际化": "internationalization",
  "流式": "streaming",
  "生态": "ecosystem",
  "数据获取": "data-fetching",
  "数据请求": "data-request",
  "项目结构": "project-structure",
  "错误处理": "error-handling",
  "错误边界": "error-boundaries",
  "图片": "image",
  "字体": "font",
  "无障碍": "accessibility",
  "速查": "cheatsheet",
  "表单": "forms",

  // Vue 系列
  "插槽": "slots",
  "依赖注入": "dependency-injection",
  "计算属性": "computed",
  "侦听器": "watcher",
  "条件": "conditional",
  "列表": "list",
  "自定义指令": "directives",
  "组合式函数": "composables",
  "渲染函数": "render-function",
  "虚拟DOM": "virtual-dom",
  "编译器宏": "compiler-macros",

  // TypeScript 系列
  "类型断言": "type-assertion",
  "类型收窄": "type-narrowing",
  "类型注解": "type-annotation",
  "类型推导": "type-inference",
  "类型别名": "type-alias",
  "映射类型": "mapped-types",
  "条件类型": "conditional-types",
  "声明文件": "declaration-files",
  "报错": "errors",
  "排查": "troubleshooting",
  "新特性": "new-features",
  "类型兼容性": "type-compatibility",
  "类型体操": "type-gymnastics",

  // JavaScript 系列
  "位运算": "bitwise",
  "权限": "permissions",
  "工具函数": "utility-functions",
  "防抖": "debounce",
  "节流": "throttle",
  "深拷贝": "deep-clone",
  "本地化": "localization",
  "内存": "memory",
  "垃圾回收": "gc",
  "正则表达式": "regex",
  "闭包": "closure",
  "作用域": "scope",
  "原型": "prototype",
  "继承": "inheritance",
  "可选链": "optional-chaining",

  // CSS 系列
  "溢出": "overflow",
  "滚动": "scroll",
  "滚动吸附": "scroll-snap",
  "轮播": "carousel",
  "宽高比": "aspect-ratio",
};

// 翻译中文为英文
function translateChineseToEnglish(text: string): string {
  let result = text;
  
  // 按长度降序排列，优先匹配长词
  const sortedKeys = Object.keys(chineseToEnglish).sort((a, b) => b.length - a.length);
  
  for (const chinese of sortedKeys) {
    const english = chineseToEnglish[chinese];
    result = result.replace(new RegExp(chinese, 'g'), english);
  }
  
  // 移除剩余的中文字符
  result = result.replace(/[\u4e00-\u9fa5]+/g, '');
  
  return result;
}

// 生成 slug
export function generateSlug(text: string): string {
  // 先翻译中文
  const translated = translateChineseToEnglish(text);
  
  return translated
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// 格式化日期
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 截取摘要
export function truncate(text: string, length: number = 150): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

// 计算阅读时间（分钟）
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
