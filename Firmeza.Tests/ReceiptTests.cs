using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Firmeza.Application.Services.Receipts;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Xunit;

namespace Firmeza.Tests;

public class ReceiptTests
{
    [Fact]
    public void GenerateReceiptPdf_Should_Return_Valid_Pdf_Binary()
    {
        var receiptService = new ReceiptService();

        var sale = new Sale
        {
            Id = 999,
            SaleNumber = "FZ-TEST-0999",
            Date = DateTime.UtcNow,
            TotalAmount = 119000,
            Customer = new Customer
            {
                Name = "Constructora Prueba S.A.S.",
                Document = "900.123.456-7",
                Email = "test@constructora.com",
                Phone = "3001234567"
            },
            Details = new List<SaleDetail>
            {
                new SaleDetail
                {
                    Quantity = 2,
                    UnitPrice = 50000,
                    Product = new Product
                    {
                        Name = "Cemento Gris Argos 50kg",
                        Sku = "CEM-ARG-50"
                    }
                }
            }
        };

        var pdfBytes = receiptService.GenerateReceiptPdf(sale);

        Assert.NotNull(pdfBytes);
        Assert.True(pdfBytes.Length > 200, "El PDF generado debe contener datos legibles");

        // Cabecera estándar PDF (%PDF-)
        var header = Encoding.ASCII.GetString(pdfBytes, 0, Math.Min(5, pdfBytes.Length));
        Assert.StartsWith("%PDF", header);
    }

    [Fact]
    public void SaveReceiptToDisk_Should_Persist_File_To_Specified_Path()
    {
        var receiptService = new ReceiptService();
        var tempDir = Path.Combine(Path.GetTempPath(), "firmeza_test_recibos_" + Guid.NewGuid().ToString("N"));

        try
        {
            var sale = new Sale
            {
                Id = 888,
                SaleNumber = "FZ-TEST-DISK",
                Date = DateTime.UtcNow,
                TotalAmount = 250000
            };

            var dummyPdf = Encoding.ASCII.GetBytes("%PDF-1.4 TEST RECEIPT DUMMY DATA");
            var savedPath = receiptService.SaveReceiptToDisk(sale, dummyPdf, tempDir);

            Assert.True(File.Exists(savedPath));
            var retrieved = receiptService.GetReceiptFromDisk(sale.SaleNumber, tempDir);
            Assert.NotNull(retrieved);
            Assert.Equal(dummyPdf.Length, retrieved.Length);
        }
        finally
        {
            if (Directory.Exists(tempDir))
            {
                Directory.Delete(tempDir, true);
            }
        }
    }
}
