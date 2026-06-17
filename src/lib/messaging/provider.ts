export interface MessagingProvider {
  sendOtp(phone: string, code: string): Promise<void>
  sendWhatsApp(phone: string, body: string): Promise<void>
  sendSms(phone: string, body: string): Promise<void>
  sendEmail(email: string, subject: string, body: string): Promise<void>
}

/**
 * Development messaging provider — logs all messages to console instead of
 * making real API calls. Used when production credentials are not configured.
 */
export class DevMessagingProvider implements MessagingProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    console.log('[DEV OTP]', phone, code)
  }

  async sendWhatsApp(phone: string, body: string): Promise<void> {
    console.log('[DEV WhatsApp]', phone, body)
  }

  async sendSms(phone: string, body: string): Promise<void> {
    console.log('[DEV SMS]', phone, body)
  }

  async sendEmail(email: string, subject: string, body: string): Promise<void> {
    console.log('[DEV Email]', email, subject, body)
  }
}

/**
 * Twilio / WhatsApp Cloud API production provider.
 * Only instantiated when the required environment variables are present.
 */
export class ProductionMessagingProvider implements MessagingProvider {
  private twilioAccountSid: string
  private twilioAuthToken: string
  private twilioFromPhone: string
  private whatsappAccessToken: string
  private whatsappPhoneNumberId: string

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || ''
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || ''
    this.twilioFromPhone = process.env.TWILIO_FROM_PHONE || ''
    this.whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    // Use Twilio Verify service when available
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID
    if (verifyServiceSid && this.twilioAccountSid && this.twilioAuthToken) {
      const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`
      const body = new URLSearchParams({ To: phone, Channel: 'sms' })
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              `${this.twilioAccountSid}:${this.twilioAuthToken}`
            ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })
      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Twilio Verify OTP failed: ${err}`)
      }
      return
    }
    // Fallback: send OTP via plain SMS
    await this.sendSms(phone, `קוד האימות שלך: ${code}`)
  }

  async sendWhatsApp(phone: string, body: string): Promise<void> {
    if (!this.whatsappAccessToken || !this.whatsappPhoneNumberId) {
      console.warn('[WhatsApp] Missing credentials, falling back to console log')
      console.log('[WhatsApp FALLBACK]', phone, body)
      return
    }
    const url = `https://graph.facebook.com/v18.0/${this.whatsappPhoneNumberId}/messages`
    const normalizedPhone = phone.startsWith('+') ? phone.slice(1) : phone
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: { body },
      }),
    })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`WhatsApp send failed: ${err}`)
    }
  }

  async sendSms(phone: string, body: string): Promise<void> {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioFromPhone) {
      console.warn('[SMS] Missing Twilio credentials, falling back to console log')
      console.log('[SMS FALLBACK]', phone, body)
      return
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`
    const params = new URLSearchParams({
      From: this.twilioFromPhone,
      To: phone,
      Body: body,
    })
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(
            `${this.twilioAccountSid}:${this.twilioAuthToken}`
          ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Twilio SMS send failed: ${err}`)
    }
  }

  async sendEmail(email: string, subject: string, body: string): Promise<void> {
    // Placeholder — integrate with SendGrid / Resend / Nodemailer as needed
    console.log('[Email STUB]', email, subject, body)
  }
}

/**
 * Return the appropriate messaging provider based on environment configuration.
 * Falls back to DevMessagingProvider when production credentials are absent.
 */
export function getMessagingProvider(): MessagingProvider {
  const hasWhatsApp =
    !!process.env.WHATSAPP_ACCESS_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID
  const hasTwilio =
    !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN

  if (hasWhatsApp || hasTwilio) {
    return new ProductionMessagingProvider()
  }

  return new DevMessagingProvider()
}
