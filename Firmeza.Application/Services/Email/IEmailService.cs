using System.Threading.Tasks;

namespace Firmeza.Application.Services.Email;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody, byte[]? attachmentBytes = null, string? attachmentFileName = null);
    Task SendPurchaseConfirmationAsync(string toEmail, string customerName, string saleNumber, decimal totalAmount, byte[] pdfReceiptBytes);
    Task SendWelcomeRegistrationAsync(string toEmail, string customerName);
}
