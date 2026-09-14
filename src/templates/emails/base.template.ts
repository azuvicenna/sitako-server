export interface BaseEmailOptions {
  title: string;
  previewText?: string;
  contentHtml: string;
  appUrl?: string;
}

export const renderBaseEmailLayout = ({
  title,
  previewText = '',
  contentHtml,
  appUrl = process.env.APP_URL || 'http://localhost:3000',
}: BaseEmailOptions): string => {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f1f5f9;
      padding: 30px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      padding: 24px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 4px 0 0 0;
      color: #bfdbfe;
      font-size: 13px;
    }
    .content {
      padding: 32px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      border-radius: 6px;
      margin: 16px 0;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
    }
    .badge-info { background-color: #e0f2fe; color: #0369a1; }
    .badge-warning { background-color: #fef3c7; color: #b45309; }
    .badge-danger { background-color: #fee2e2; color: #b91c1c; }
    .badge-success { background-color: #dcfce7; color: #15803d; }
    .table-detail {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    .table-detail td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
    }
    .table-detail td.label {
      width: 35%;
      color: #64748b;
      font-weight: 500;
    }
    .table-detail td.value {
      font-weight: 600;
      color: #0f172a;
    }
    .preview-text {
      display: none;
      font-size: 1px;
      line-height: 1px;
      max-height: 0px;
      max-width: 0px;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${previewText ? `<div class="preview-text">${previewText}</div>` : ''}
  <div class="wrapper">
    <table class="container" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <h1>SITAKO</h1>
          <p>Sistem Informasi Perpustakaan Sekolah</p>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${contentHtml}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="margin: 0 0 6px 0;">Email ini dikirim otomatis oleh sistem SITAKO. Mohon tidak membalas langsung ke email ini.</p>
          <p style="margin: 0;">&copy; ${currentYear} SITAKO Library. <a href="${appUrl}">Kunjungi Perpustakaan</a></p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};
