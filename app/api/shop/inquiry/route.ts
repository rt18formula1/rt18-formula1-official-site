import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "dummy");

export async function POST(req: Request) {
  try {
    const { name, email, orderId, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // RESEND_API_KEYがない場合はコンソールログに出力するだけにする（開発/テスト用）
    if (!process.env.RESEND_API_KEY) {
      console.log('--- DEVELOPMENT MODE (No Resend API Key) ---');
      console.log(`To: Shop Owner`);
      console.log(`From: ${name} <${email}>`);
      console.log(`Subject: [Shop Inquiry] ${subject || 'No Subject'}`);
      console.log(`Order ID: ${orderId || 'None'}`);
      console.log(`Message: \n${message}`);
      console.log('--------------------------------------------');
      
      return NextResponse.json({ success: true, dummy: true });
    }

    // TODO: 本番環境では送受信メールアドレスを適切に設定してください
    // from: カスタムドメインのアドレス（例: no-reply@yourdomain.com）。現在はテスト用の onboarding@resend.dev。
    // to: お問い合わせを受け取る管理者のアドレス。現在はテスト用の delivered@resend.dev またはご自身の登録アドレス。
    const { data, error } = await resend.emails.send({
      from: 'Shop System <onboarding@resend.dev>', 
      to: [process.env.CONTACT_EMAIL || 'delivered@resend.dev'], 
      subject: `[Shop Inquiry] ${subject || 'No Subject'}`,
      text: `
以下の内容でお問い合わせがありました。

お名前: ${name}
メールアドレス: ${email}
注文番号: ${orderId || 'なし'}
件名: ${subject || 'なし'}

メッセージ:
${message}
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
