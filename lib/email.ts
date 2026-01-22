import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SITE_NAME = "VixenAhri Blog";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://blog.vixenahri.cn";

interface CommentNotificationParams {
  to: string;
  postTitle: string;
  postSlug: string;
  commenterName: string;
  commentContent: string;
  replyContent: string;
  replyAuthor: string;
}

// 评论回复通知邮件
export async function sendCommentReplyNotification({
  to,
  postTitle,
  postSlug,
  commenterName,
  commentContent,
  replyContent,
  replyAuthor,
}: CommentNotificationParams) {
  if (!resend) {
    console.log("Resend not configured, skipping email notification");
    return { success: false, error: "Email service not configured" };
  }

  const postUrl = `${SITE_URL}/posts/${postSlug}`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${SITE_NAME} <noreply@vixenahri.cn>`,
      to: [to],
      subject: `您在「${postTitle}」的评论收到了回复`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${SITE_NAME}</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Hi ${commenterName}，</p>
            
            <p>您在文章「<a href="${postUrl}" style="color: #2563eb; text-decoration: none;">${postTitle}</a>」中的评论收到了新回复：</p>
            
            <div style="background: white; border-left: 4px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #666; font-size: 14px;">您的评论：</p>
              <p style="margin: 10px 0 0; color: #333;">${commentContent}</p>
            </div>
            
            <div style="background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #666; font-size: 14px;"><strong>${replyAuthor}</strong> 回复了您：</p>
              <p style="margin: 10px 0 0; color: #333;">${replyContent}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${postUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 500;">查看完整对话</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; margin-bottom: 0; text-align: center;">
              此邮件由 ${SITE_NAME} 自动发送，请勿直接回复。<br>
              如果您不想再收到此类通知，请忽略此邮件。
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

// 新评论通知（发给管理员）
export async function sendNewCommentNotification({
  postTitle,
  postSlug,
  commenterName,
  commenterEmail,
  commentContent,
}: {
  postTitle: string;
  postSlug: string;
  commenterName: string;
  commenterEmail: string;
  commentContent: string;
}) {
  if (!resend) {
    return { success: false, error: "Email service not configured" };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return { success: false, error: "Admin email not configured" };
  }

  const postUrl = `${SITE_URL}/posts/${postSlug}`;
  const adminUrl = `${SITE_URL}/admin/comments`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${SITE_NAME} <noreply@vixenahri.cn>`,
      to: [adminEmail],
      subject: `[新评论] ${commenterName} 在「${postTitle}」发表了评论`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">新评论通知</h2>
          
          <p><strong>文章：</strong><a href="${postUrl}">${postTitle}</a></p>
          <p><strong>评论者：</strong>${commenterName} (${commenterEmail})</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;">${commentContent}</p>
          </div>
          
          <p>
            <a href="${adminUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">前往审核</a>
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Failed to send email" };
  }
}
