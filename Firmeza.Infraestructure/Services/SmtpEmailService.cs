using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Firmeza.Application.Services.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Firmeza.Infraestructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, byte[]? attachmentBytes = null, string? attachmentFileName = null)
    {
        if (string.IsNullOrWhiteSpace(toEmail)) return;

        var host = _config["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
        var port = int.TryParse(_config["EmailSettings:Port"], out var p) ? p : 587;
        var senderEmail = _config["EmailSettings:SenderEmail"] ?? "notificaciones@firmeza.com";
        var senderName = _config["EmailSettings:SenderName"] ?? "Firmeza S.A.S.";
        var username = _config["EmailSettings:Username"] ?? senderEmail;
        var password = _config["EmailSettings:Password"];
        var enableSsl = bool.TryParse(_config["EmailSettings:EnableSsl"], out var ssl) ? ssl : true;

        if (string.IsNullOrWhiteSpace(password))
        {
            _logger.LogWarning("EmailService: No se ha configurado la contraseña SMTP en EmailSettings:Password. El correo para {ToEmail} se omite en modo desarrollo.", toEmail);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(new MailAddress(toEmail));

            if (attachmentBytes != null && attachmentBytes.Length > 0)
            {
                var ms = new MemoryStream(attachmentBytes);
                var fileName = string.IsNullOrWhiteSpace(attachmentFileName) ? "comprobante.pdf" : attachmentFileName;
                message.Attachments.Add(new Attachment(ms, fileName, "application/pdf"));
            }

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(username, password),
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 15000
            };

            await client.SendMailAsync(message);
            _logger.LogInformation("EmailService: Correo enviado exitosamente a {ToEmail} (Asunto: {Subject})", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EmailService: Error al enviar correo SMTP a {ToEmail}", toEmail);
        }
    }

    public async Task SendPurchaseConfirmationAsync(string toEmail, string customerName, string saleNumber, decimal totalAmount, byte[] pdfReceiptBytes)
    {
        var subject = $"Comprobante de Compra {saleNumber} - Firmeza Materiales";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }}
    .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 20px; color: #06b6d4; letter-spacing: 1px; }}
    .content {{ padding: 24px; }}
    .badge {{ display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 13px; }}
    .total-box {{ background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 14px; text-align: center; margin: 20px 0; }}
    .footer {{ background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <h1>FIRMEZA S.A.S.</h1>
      <p style='margin: 4px 0 0; font-size: 12px; color: #94a3b8;'>Materiales & Soluciones para la Construcción</p>
    </div>
    <div class='content'>
      <p>Estimado(a) <strong>{customerName}</strong>,</p>
      <p>¡Muchas gracias por su compra! Su solicitud de materiales ha sido procesada correctamente en nuestro sistema central.</p>
      <div style='margin: 15px 0;'>
        <span class='badge'>Comprobante Nº {saleNumber}</span>
      </div>
      <div class='total-box'>
        <span style='font-size: 12px; color: #64748b;'>TOTAL FACTURADO (IVA INCLUIDO)</span><br>
        <strong style='font-size: 22px; color: #0f172a;'>$ {totalAmount:N0} COP</strong>
      </div>
      <p style='font-size: 13px; color: #475569;'>
        Adjunto a este correo encontrará su <strong>comprobante oficial en formato PDF</strong> con el desglose de materiales, cantidades y bases tributarias.
      </p>
      <p style='font-size: 12px; color: #64748b;'>Si tiene preguntas sobre su despacho en obra, puede contactarnos a <a href='mailto:soporte@firmeza.com'>soporte@firmeza.com</a>.</p>
    </div>
    <div class='footer'>
      FIRMEZA ERP · Bodega Central Industrial #45-12 · PBX (+57) 601 555-0199
    </div>
  </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody, pdfReceiptBytes, $"recibo_{saleNumber}.pdf");
    }

    public async Task SendWelcomeRegistrationAsync(string toEmail, string customerName)
    {
        var subject = "¡Bienvenido a Firmeza! Cuenta de Cliente Habilitada";
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }}
    .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 20px; color: #06b6d4; }}
    .content {{ padding: 24px; }}
    .footer {{ background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <h1>FIRMEZA MATERIALES</h1>
      <p style='margin: 4px 0 0; font-size: 12px; color: #94a3b8;'>Portal Digital de Clientes y Obras</p>
    </div>
    <div class='content'>
      <p>Hola <strong>{customerName}</strong>,</p>
      <p>Tu cuenta ha sido creada exitosamente. Ya puedes acceder al catálogo de productos, armar tu carrito de compras y cotizar materiales con entrega directa en obra.</p>
      <p style='font-size: 13px; color: #475569;'>Accede con tu correo <strong>{toEmail}</strong> desde nuestro portal web.</p>
    </div>
    <div class='footer'>
      FIRMEZA ERP · Plataforma de Suministro Industrial
    </div>
  </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }
}
