import nodemailer from 'nodemailer';
import { MailerService, mailer } from '@/config/mailer';

function formatTanggalIndo(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

function titleCaseFeatureName(feature: string): string {
  return feature
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map(s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s))
    .join(' ');
}

declare module '@/config/mailer' {
  interface MailerService {
    sendTierChangeEmail(
      to: string,
      recipientName: string | undefined,
      previous: string,
      next: string,
      reason: string
    ): Promise<nodemailer.SentMessageInfo>;

    sendExpirationWarningEmail(
      to: string,
      recipientName: string | undefined,
      daysLeft: number
    ): Promise<nodemailer.SentMessageInfo>;

    sendGracePeriodEmail(
      to: string,
      recipientName: string | undefined,
      gracePeriodEnd: Date
    ): Promise<nodemailer.SentMessageInfo>;

    sendTierUpgradePromptEmail(
      to: string,
      recipientName: string | undefined,
      feature: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

MailerService.prototype.sendTierChangeEmail = async function (
  to: string,
  recipientName: string | undefined,
  previous: string,
  next: string,
  reason: string
) {
  const subject = 'Perubahan Paket Langganan Anda';
  const name = recipientName || to;
  const alasanMap: Record<string, string> = {
    expiration: 'masa berlangganan berakhir',
    upgrade: 'permintaan upgrade',
    downgrade: 'perubahan paket',
  };
  const alasan = alasanMap[reason] || 'perubahan paket';

  const appUrl = process.env.FRONTEND_URL || 'https://app.stokreal.com';

  const text = `Halo ${name},\n\nPaket langganan Anda telah berubah dari ${previous} menjadi ${next} karena ${alasan}.\n\nAnda tetap dapat mengakses data Anda. Jika ingin menyesuaikan paket, silakan kelola langganan Anda.\n\nKelola Langganan: ${appUrl}/pengaturan/langganan\n\nTerima kasih,\nTim StokReal`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111827; background: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: #2563eb; color: #fff; padding: 24px; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
        .muted { color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">Perubahan Paket Langganan</h2>
        </div>
        <div class="content">
          <p>Halo ${name},</p>
          <p>Paket langganan Anda telah berubah dari <strong>${previous}</strong> menjadi <strong>${next}</strong> karena <em>${alasan}</em>.</p>
          <p>Data Anda tetap aman. Anda dapat menyesuaikan paket kapan saja melalui halaman pengaturan.</p>
          <p>
            <a class="btn" href="${appUrl}/pengaturan/langganan" target="_blank" rel="noopener">Kelola Langganan</a>
          </p>
          <p class="muted">Terima kasih telah menggunakan StokReal.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return this.sendMail({ to, subject, text, html });
};

MailerService.prototype.sendExpirationWarningEmail = async function (
  to: string,
  recipientName: string | undefined,
  daysLeft: number
) {
  const subject = 'Langganan Premium Anda Akan Berakhir';
  const name = recipientName || to;
  const appUrl = process.env.FRONTEND_URL || 'https://app.stokreal.com';
  const perkiraanTanggal = formatTanggalIndo(new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000));

  const text = `Halo ${name},\n\nLangganan Premium Anda akan berakhir dalam ${daysLeft} hari (perkiraan: ${perkiraanTanggal}). Untuk menghindari gangguan layanan, silakan perpanjang sekarang.\n\nPerpanjang Langganan: ${appUrl}/pengaturan/langganan\n\nTerima kasih,\nTim StokReal`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111827; background: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: #2563eb; color: #fff; padding: 24px; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
        .muted { color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">Pengingat Perpanjangan</h2>
        </div>
        <div class="content">
          <p>Halo ${name},</p>
          <p>Langganan <strong>Premium</strong> Anda akan berakhir dalam <strong>${daysLeft} hari</strong> (perkiraan: <strong>${perkiraanTanggal}</strong>).</p>
          <p>Agar fitur Premium tetap aktif tanpa gangguan, silakan perpanjang sekarang.</p>
          <p>
            <a class="btn" href="${appUrl}/pengaturan/langganan" target="_blank" rel="noopener">Perpanjang Langganan</a>
          </p>
          <p class="muted">Terima kasih telah mempercayai StokReal.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return this.sendMail({ to, subject, text, html });
};

MailerService.prototype.sendGracePeriodEmail = async function (
  to: string,
  recipientName: string | undefined,
  gracePeriodEnd: Date
) {
  const subject = 'Masa Tenggang Premium Anda Aktif';
  const name = recipientName || to;
  const appUrl = process.env.FRONTEND_URL || 'https://app.stokreal.com';
  const batasTanggal = formatTanggalIndo(gracePeriodEnd);

  const text = `Halo ${name},\n\nLangganan Anda telah berakhir, namun masa tenggang 7 hari saat ini aktif hingga ${batasTanggal}. Silakan perpanjang sebelum masa tenggang berakhir agar akses Premium tetap berlanjut.\n\nPerpanjang Sekarang: ${appUrl}/pengaturan/langganan\n\nTerima kasih,\nTim StokReal`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111827; background: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: #2563eb; color: #fff; padding: 24px; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
        .muted { color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">Masa Tenggang Aktif</h2>
        </div>
        <div class="content">
          <p>Halo ${name},</p>
          <p>Langganan Anda telah berakhir. Masa tenggang <strong>7 hari</strong> aktif hingga <strong>${batasTanggal}</strong>.</p>
          <p>Untuk mempertahankan akses ke seluruh fitur Premium, silakan perpanjang sebelum masa tenggang berakhir.</p>
          <p>
            <a class="btn" href="${appUrl}/pengaturan/langganan" target="_blank" rel="noopener">Perpanjang Sekarang</a>
          </p>
          <p class="muted">Kami siap membantu jika ada pertanyaan.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return this.sendMail({ to, subject, text, html });
};

MailerService.prototype.sendTierUpgradePromptEmail = async function (
  to: string,
  recipientName: string | undefined,
  feature: string
) {
  const niceFeature = titleCaseFeatureName(feature);
  const subject = `Akses ${niceFeature} dengan Premium`;
  const name = recipientName || to;
  const appUrl = process.env.FRONTEND_URL || 'https://app.stokreal.com';

  const text = `Halo ${name},\n\nFitur ${niceFeature} tersedia di paket Premium. Upgrade sekarang untuk membuka fitur ini dan tingkatkan produktivitas pengelolaan stok Anda.\n\nUpgrade ke Premium: ${appUrl}/pengaturan/langganan\n\nTerima kasih,\nTim StokReal`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111827; background: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: #2563eb; color: #fff; padding: 24px; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 24px; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; padding: 12px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
        .muted { color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">Upgrade untuk Fitur Lebih Lengkap</h2>
        </div>
        <div class="content">
          <p>Halo ${name},</p>
          <p>Fitur <strong>${niceFeature}</strong> tersedia di paket <strong>Premium</strong>. Upgrade sekarang untuk membuka fitur ini dan tingkatkan produktivitas pengelolaan stok Anda.</p>
          <p>
            <a class="btn" href="${appUrl}/pengaturan/langganan" target="_blank" rel="noopener">Upgrade ke Premium</a>
          </p>
          <p class="muted">Terima kasih telah menggunakan StokReal.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return this.sendMail({ to, subject, text, html });
};

// Ensure the module executes and augments at import time
// Force module evaluation to ensure prototype augmentation side-effects
export const _tierEmailsInitialized = mailer;
