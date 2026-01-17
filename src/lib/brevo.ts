
import * as brevo from '@getbrevo/brevo';
import { OrderStatus } from './types';

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


export async function sendOrderStatusUpdateEmail({
  customerEmail,
  customerName,
  orderId,
  newStatus,
}: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  newStatus: OrderStatus;
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
  sendSmtpEmail.htmlContent = `
    <html>
      <body>
        <h1>Hello ${customerName},</h1>
        <p>There's an update on your KOSH order (${orderId}).</p>
        <p>The status has been updated to: <strong>${newStatus}</strong>.</p>
        <p>Thank you for shopping with us!</p>
      </body>
    </html>
  `;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully. Brevo API response:', data.body);
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    console.error('Error sending email via Brevo:', error);
    return { success: false, message: 'Failed to send email.' };
  }
}
