import { normalizeIsraeliPhone } from '@/lib/utils'

export interface MessagingProvider {
  sendOtp(phone: string, code: string): Promise<void>
  sendWhatsApp(phone: string, body: string): Promise<void>
  sendSms(phone: string, body: string): Promise<void>
  sendEmail(email: string, subject: string, body: string): Promise<void>
  // Optional: implemented by TwilioMessagingProvider for Twilio Verify flow
  startVerification?: (phone: string) => Promise<void>
  checkVerification?: (phone: string, code: string) => Promise<boolean>
}

/**
 * Development messaging provider — logs all messages to console.
 * Used when Twilio credentials are not configured (MESSAGING_DEV_MODE=true or missing creds).
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
 * Twilio WhatsApp production provider.
 * Activated when MESSAGING_PROVIDER=twilio and MESSAGING_DEV_MODE!=true.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *   TWILIO_VERIFY_SERVICE_SID  (for OTP via Twilio Verify)
 */
export class TwilioMessagingProvider implements MessagingProvider {
  private get accountSid() { return process.env.TWILIO_ACCOUNT_SID ?? '' }
  private get verifyServiceSid() { return process.env.TWILIO_VERIFY_SERVICE_SID ?? '' }

  private basicAuth(): string {
    const sid = process.env.TWILIO_ACCOUNT_SID ?? ''
    const tok = process.env.TWILIO_AUTH_TOKEN ?? ''
    return 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64')
  }

  private whatsappFrom(): string {
    const from = process.env.TWILIO_WHATSAPP_FROM ?? ''
    return from.startsWith('whatsapp:') ? from : `whatsapp:${from}`
  }

  private toWhatsapp(phone: string): string {
    const normalized = normalizeIsraeliPhone(phone)
    return `whatsapp:${normalized}`
  }

  /** Start Twilio Verify OTP via WhatsApp channel */
  async startVerification(phone: string): Promise<void> {
    const to = this.toWhatsapp(phone)
    const url = `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/Verifications`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.basicAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, Channel: 'whatsapp' }).toString(),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Twilio Verify start failed (${res.status}): ${err}`)
    }
  }

  /** Check a Twilio Verify OTP; returns true if approved */
  async checkVerification(phone: string, code: string): Promise<boolean> {
    const to = this.toWhatsapp(phone)
    const url = `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/VerificationCheck`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.basicAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, Code: code }).toString(),
    })
    if (!res.ok) return false  // 404 = expired/consumed
    const data = await res.json() as { status: string }
    return data.status === 'approved'
  }

  /** Send a WhatsApp message via Twilio */
  async sendWhatsApp(phone: string, body: string): Promise<void> {
    let to: string
    try {
      to = this.toWhatsapp(phone)
    } catch {
      console.error('[TwilioWhatsApp] Invalid phone, skipping message to:', phone)
      return
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.basicAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: this.whatsappFrom(), To: to, Body: body }).toString(),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Twilio WhatsApp send failed (${res.status}): ${err}`)
    }
  }

  /** Send an OTP code via SMS fallback (used when Verify is not configured) */
  async sendOtp(phone: string, code: string): Promise<void> {
    await this.sendSms(phone, `קוד האימות שלך: ${code}`)
  }

  async sendSms(phone: string, body: string): Promise<void> {
    let normalized: string
    try {
      normalized = normalizeIsraeliPhone(phone)
    } catch {
      console.error('[TwilioSMS] Invalid phone, skipping:', phone)
      return
    }
    const fromPhone = process.env.TWILIO_FROM_PHONE ?? ''
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: this.basicAuth(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: fromPhone, To: normalized, Body: body }).toString(),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Twilio SMS send failed (${res.status}): ${err}`)
    }
  }

  async sendEmail(email: string, subject: string, body: string): Promise<void> {
    console.log('[Email STUB]', email, subject, body)
  }
}

/**
 * Return the appropriate messaging provider based on environment.
 * Returns TwilioMessagingProvider when MESSAGING_PROVIDER=twilio and creds present.
 * Falls back to DevMessagingProvider.
 */
export function getMessagingProvider(): MessagingProvider {
  if (
    process.env.MESSAGING_PROVIDER === 'twilio' &&
    process.env.MESSAGING_DEV_MODE !== 'true' &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
  ) {
    return new TwilioMessagingProvider()
  }
  return new DevMessagingProvider()
}

/** Returns true when running in dev/console-log mode */
export function isDevMessagingMode(): boolean {
  return !(
    process.env.MESSAGING_PROVIDER === 'twilio' &&
    process.env.MESSAGING_DEV_MODE !== 'true' &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
  )
}
