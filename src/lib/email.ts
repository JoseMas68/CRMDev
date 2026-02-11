import { Resend } from "resend";
import { ReactElement } from "react";
import OrganizationInvitationEmail from "@/emails/organization-invitation-email";

// Initialize Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  react,
  from,
}: {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}) {
  if (!resend) {
    console.log("[EMAIL] Resend not configured. Email would be sent:", {
      to,
      subject,
    });
    return { success: false, error: "Resend not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: from || `${process.env.NEXT_PUBLIC_APP_NAME || "CRMDev"} <noreply@crmdev.tech>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    });

    if (error) {
      console.error("[EMAIL] Error sending email:", error);
      return { success: false, error };
    }

    console.log("[EMAIL] Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("[EMAIL] Exception sending email:", error);
    return { success: false, error };
  }
}

/**
 * Send organization invitation email
 */
export async function sendOrganizationInvitationEmail({
  email,
  inviterName,
  organizationName,
  invitationId,
}: {
  email: string;
  inviterName: string;
  organizationName: string;
  invitationId: string;
}) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${invitationId}`;

  return sendEmail({
    to: email,
    subject: `Invitación para unirte a ${organizationName}`,
    react: OrganizationInvitationEmail({
      inviterName,
      organizationName,
      inviteUrl,
      appName: process.env.NEXT_PUBLIC_APP_NAME || "CRMDev",
    }),
  });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail({
  email,
  verificationUrl,
}: {
  email: string;
  verificationUrl: string;
}) {
  // TODO: Create verification email template
  console.log("[EMAIL] Verification email would be sent to:", email);
  return { success: true };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  // TODO: Create password reset email template
  console.log("[EMAIL] Password reset email would be sent to:", email);
  return { success: true };
}
