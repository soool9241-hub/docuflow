import { SolapiMessageService } from 'solapi'

const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
)

export async function sendSMS(to: string, text: string) {
  return messageService.sendOne({
    to,
    from: process.env.SOLAPI_SENDER_PHONE!,
    text,
  })
}
