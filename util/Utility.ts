import crypto from 'crypto';

export function md5(data: Buffer | string) {
  return crypto.createHash('md5').update(data).digest('hex');
}

export function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function nonce() {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(pwd: string) {
  return md5(pwd);
}

export function decryptSecret(appId: string, encrypted: string) {
  const hash = md5(appId);

  const key = Buffer.from(hash.substring(0, 16));
  const iv = Buffer.from(hash.substring(16));

  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(false);

  let decrypted = decipher.update(Buffer.from(encrypted, 'base64'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString().trim();
}

export function generateSign(headers: Record<string, string>, REAL_SECRET: string) {
  const sorted = Object.keys(headers)
    .sort()
    .map((k) => `${k}=${headers[k]}`)
    .join('&');

  const b64 = Buffer.from(sorted).toString('base64');

  const hmac = crypto.createHmac('sha256', REAL_SECRET).update(b64).digest();

  return md5(hmac).toLowerCase();
}

export const toLocalDateTimeTH = () => {
  const now = new Date();
  return now.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  });
};

export const dateToLocalDateTimeTH = (date: Date | string) => {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return parsedDate.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  });
};
