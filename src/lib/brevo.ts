
import * as brevo from '@getbrevo/brevo';
import type { Order, OrderStatus } from './types';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const BREVO_SENDER_NAME = 'KOSH';

if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
  console.warn("Brevo API Key or Sender Email is not configured. Email notifications will be disabled.");
}

const apiInstance = new brevo.TransactionalEmailsApi();
// Configure API key authorization: apiKey
if (BREVO_API_KEY) {
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
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
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    console.error("Cannot send email due to missing Brevo configuration.");
    // Don't throw an error, just log and return. The main flow shouldn't fail because of email.
    return { success: false, message: "Email service is not configured." };
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = `Your KOSH Order is Confirmed! #${order.id.slice(-6)}`;
  sendSmtpEmail.to = [{ email: customerEmail, name: customerName }];
  sendSmtpEmail.sender = { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL };

  const itemsList = order.orderItems.map(item => `<li>${item.name} (x${item.quantity}) - ₹${(item.price * item.quantity).toFixed(2)}</li>`).join('');

  sendSmtpEmail.htmlContent = `
    <html>
      <body style="font-family: sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h1 style="color: #333;">Hello ${customerName},</h1>
          <p>Thank you for your order! Your order <strong>#${order.id.slice(-6)}</strong> has been confirmed.</p>
          <h2 style="border-bottom: 1px solid #ddd; padding-bottom: 10px;">Order Summary</h2>
          <ul style="list-style: none; padding: 0;">
              ${itemsList}
          </ul>
          <h3 style="text-align: right;">Total: ₹${order.totalPrice.toFixed(2)}</h3>
          <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 10px;">Shipping to:</h3>
          <p>
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.pincode}
          </p>
          <p>We'll notify you again once your order has been dispatched.</p>
          <p>Thank you for shopping with us!</p>
          <p><strong>The KOSH Team</strong></p>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Order confirmation email sent successfully for order ${order.id}. Brevo API response:`, data.body);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error(`Error sending order confirmation email for order ${order.id} via Brevo:`, error);
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
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    console.error("Cannot send email due to missing Brevo configuration.");
    return { success: false, message: "Email service is not configured." };
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();

  sendSmtpEmail.subject = `Your KOSH Order Status: ${orderId.slice(-6)}`;
  sendSmtpEmail.to = [
    { email: customerEmail, name: customerName },
  ];
  sendSmtpEmail.sender = { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL };
  
  let htmlContent = '';
  const formatStatus = (status = "") =>
    status
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  
  const formattedStatus = formatStatus(newStatus);
  
  if (newStatus === 'dispatched' && trackingId) {
    htmlContent = `
    <html>
      <body>
        <h1>Hello ${customerName},</h1>
        <p>Great news! Your KOSH order (${orderId.slice(-6)}) has been Dispatched.</p>
        <p>You can track your package using this tracking ID/link: <strong>${trackingId}</strong></p>
        <p>Thank you for shopping with us!</p>
      </body>
    </html>
    `
  } else {
    htmlContent = `
    <html>
      <body>
        <h1>Hello ${customerName},</h1>
        <p>There's an update on your KOSH order (${orderId.slice(-6)}).</p>
        <p>The status has been updated to: <strong>${formattedStatus}</strong>.</p>
        <p>Thank you for shopping with us!</p>
      </body>
    </html>
  `;
  }

  sendSmtpEmail.htmlContent = htmlContent;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully. Brevo API response:', data.body);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    return { success: false, message: 'Failed to send email.' };
  }
}
