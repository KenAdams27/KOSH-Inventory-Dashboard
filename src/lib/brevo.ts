import * as brevo from '@getbrevo/brevo';
import type { Order, OrderStatus } from './types';

const BREVO_SENDER_NAME = 'KKosh';
const BREVO_CC_EMAIL = 'koshkunalenterprises32@gmail.com';

function getApiInstance() {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is missing");
  }

  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    apiKey
  );

  return apiInstance;
}

function getSenderEmail() {
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is missing");
  }

  return senderEmail;
}

export async function sendWelcomeEmail({
  customerEmail,
  customerName,
}: {
  customerEmail: string;
  customerName: string;
}) {
  try {
    const apiInstance = getApiInstance();
    const senderEmail = getSenderEmail();

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = `Welcome to KKosh! 🎉`;
    sendSmtpEmail.to = [{ email: customerEmail, name: customerName }];
    sendSmtpEmail.cc = [{ email: BREVO_CC_EMAIL }];
    sendSmtpEmail.sender = { name: BREVO_SENDER_NAME, email: senderEmail };

    sendSmtpEmail.htmlContent = `
      <html>
        <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #1a1a1a;">Hi there,</h2>
            <p>Welcome to KKosh! 🎉</p>
            <p>We’re excited to have you join us at <strong><a href="https://kkosh.in" style="color: #3F51B5; text-decoration: none;">kkosh.in</a></strong>.</p>
            <p>At KKosh, we’re committed to bringing you a seamless and enjoyable experience.</p>
            <ul>
              <li>Explore our latest collections</li>
              <li>Stay updated with deals</li>
              <li>Manage your account</li>
            </ul>
            <p>Warm regards,<br><strong>Team KKosh</strong></p>
          </div>
        </body>
      </html>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    return { success: true, message: 'Welcome email sent.' };

  } catch (error: any) {
    console.error("BREVO ERROR:", error?.response?.body || error.message || error);
    return { success: false, message: 'Failed to send welcome email.' };
  }
}

export async function sendOrderConfirmationEmail({
  customerEmail,
  customerName,
  order,
}: {
  customerEmail: string;
  customerName: string;
  order: Order;
}) {
  try {
    const apiInstance = getApiInstance();
    const senderEmail = getSenderEmail();

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = `Your KOSH Order is Confirmed! #${order.id.slice(-6)}`;
    sendSmtpEmail.to = [{ email: customerEmail, name: customerName }];
    sendSmtpEmail.cc = [{ email: BREVO_CC_EMAIL }];
    sendSmtpEmail.sender = { name: BREVO_SENDER_NAME, email: senderEmail };

    const itemsList = order.orderItems
      .map(item => `<li>${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toFixed(2)}</li>`)
      .join('');

    sendSmtpEmail.htmlContent = `
      <html>
        <body style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #1a1a1a;">Hello ${customerName},</h1>
            <p>Your order <strong>#${order.id.slice(-6)}</strong> is confirmed and we're getting it ready for you!</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Summary</h3>
                <ul style="list-style: none; padding-left: 0;">${itemsList}</ul>
                <hr style="border: 0; border-top: 1px solid #ddd;">
                <p style="font-size: 18px; font-weight: bold;">Total Amount: ₹${order.totalPrice.toFixed(2)}</p>
            </div>
            <p>We'll notify you as soon as your items have been shipped.</p>
            <p>Warm regards,<br><strong>Team KKosh</strong></p>
          </div>
        </body>
      </html>
    `;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Order email sent:", data.body);

    return { success: true, message: 'Email sent successfully.' };

  } catch (error: any) {
    console.error("BREVO ERROR:", error?.response?.body || error.message || error);
    return { success: false, message: 'Failed to send email.' };
  }
}

export async function sendOrderStatusUpdateEmail({
  customerEmail,
  customerName,
  orderId,
  newStatus,
  trackingId,
  dispatchedBy,
  trackingLink,
}: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  newStatus: OrderStatus;
  trackingId?: string;
  dispatchedBy?: string;
  trackingLink?: string;
}) {
  try {
    const apiInstance = getApiInstance();
    const senderEmail = getSenderEmail();

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = `Your KOSH Order Status: ${orderId.slice(-6)}`;
    sendSmtpEmail.to = [{ email: customerEmail, name: customerName }];
    sendSmtpEmail.cc = [{ email: BREVO_CC_EMAIL }];
    sendSmtpEmail.sender = { name: BREVO_SENDER_NAME, email: senderEmail };

    const formattedStatus = newStatus
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

    let htmlContent = '';

    if (newStatus === 'dispatched' && (dispatchedBy || trackingLink || trackingId)) {
      const detailRows = [
        dispatchedBy
          ? `<p style="margin: 0 0 8px 0;"><strong>Dispatched by:</strong> ${dispatchedBy}</p>`
          : '',
        trackingLink
          ? `<p style="margin: 0 0 8px 0;"><strong>Tracking Link:</strong> <a href="${trackingLink}" style="color: #3F51B5;">${trackingLink}</a></p>`
          : '',
        trackingId
          ? `<p style="margin: 0;"><strong>Tracking ID:</strong> ${trackingId}</p>`
          : '',
      ].filter(Boolean).join('');

      htmlContent = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #1a1a1a;">Hello ${customerName},</h1>
            <p>Good news! Your order (<strong>#${orderId.slice(-6)}</strong>) has been dispatched.</p>
            <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                ${detailRows}
            </div>
            ${trackingLink ? '<p>You can use the tracking link above to track the progress of your delivery.</p>' : ''}
            <p>Warm regards,<br><strong>Team KKosh</strong></p>
        </div>
      `;
    } else {
      htmlContent = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #1a1a1a;">Hello ${customerName},</h1>
            <p>The status of your order (<strong>#${orderId.slice(-6)}</strong>) has been updated to: <strong>${formattedStatus}</strong></p>
            <p>Warm regards,<br><strong>Team KKosh</strong></p>
        </div>
      `;
    }

    sendSmtpEmail.htmlContent = htmlContent;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Status email sent:", data.body);

    return { success: true, message: 'Email sent successfully.' };

  } catch (error: any) {
    console.error("BREVO ERROR:", error?.response?.body || error.message || error);
    return { success: false, message: 'Failed to send email.' };
  }
}