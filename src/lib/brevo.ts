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
    sendSmtpEmail.sender = { name: BREVO_SENDER_NAME, email: senderEmail };

    const itemsList = order.orderItems
      .map(item => `<li>${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toFixed(2)}</li>`)
      .join('');

    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <h1>Hello ${customerName},</h1>
          <p>Your order <strong>#${order.id.slice(-6)}</strong> is confirmed.</p>
          <ul>${itemsList}</ul>
          <h3>Total: ₹${order.totalPrice.toFixed(2)}</h3>
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
}: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  newStatus: OrderStatus;
  trackingId?: string;
}) {
  try {
    const apiInstance = getApiInstance();
    const senderEmail = getSenderEmail();

    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = `Your KOSH Order Status: ${orderId.slice(-6)}`;
    sendSmtpEmail.to = [{ email: customerEmail, name: customerName }];
    sendSmtpEmail.sender = { name: BREVO_SENDER_NAME, email: senderEmail };

    const formattedStatus = newStatus
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

    let htmlContent = '';

    if (newStatus === 'dispatched' && trackingId) {
      htmlContent = `
        <h1>Hello ${customerName},</h1>
        <p>Your order (${orderId.slice(-6)}) has been dispatched.</p>
        <p>Tracking ID: ${trackingId}</p>
      `;
    } else {
      htmlContent = `
        <h1>Hello ${customerName},</h1>
        <p>Status updated to <strong>${formattedStatus}</strong></p>
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