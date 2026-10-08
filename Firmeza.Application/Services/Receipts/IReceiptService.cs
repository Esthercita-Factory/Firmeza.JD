using Firmeza.Domain.Entities;

namespace Firmeza.Application.Services.Receipts;

public interface IReceiptService
{
    byte[] GenerateReceiptPdf(Sale sale);
    string SaveReceiptToDisk(Sale sale, byte[] pdfBytes, string? customPath = null);
    byte[]? GetReceiptFromDisk(string saleNumber, string? customPath = null);
}
