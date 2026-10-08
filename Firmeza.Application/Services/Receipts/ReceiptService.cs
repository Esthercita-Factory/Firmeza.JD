using System.Globalization;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Services;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Firmeza.Application.Services.Receipts;

public class ReceiptService : IReceiptService
{
    static ReceiptService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateReceiptPdf(Sale sale)
    {
        try
        {
            var breakdown = InventoryCalculator.SplitTaxInclusive(sale.TotalAmount);
            var culture = new CultureInfo("es-CO");

            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(28);
                    page.DefaultTextStyle(x => x.FontSize(9.5f).FontColor("#1e293b"));

                    page.Header().Element(c => ComposeHeader(c, sale, culture));
                    page.Content().Element(c => ComposeContent(c, sale, breakdown.SubtotalBase, breakdown.Tax, culture));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return doc.GeneratePdf();
        }
        catch
        {
            return GenerateFallbackPdf(sale);
        }
    }

    private static void ComposeHeader(IContainer container, Sale sale, CultureInfo culture)
    {
        container.BorderBottom(2).BorderColor("#06b6d4").PaddingBottom(12).Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("FIRMEZA S.A.S.").FontSize(18).ExtraBold().FontColor("#0f172a");
                col.Item().Text("Materiales & Soluciones para la Construcción").FontSize(8.5f).FontColor("#64748b");
                col.Item().PaddingTop(3).Text("NIT: 900.543.210-9 · Régimen Común").FontSize(8).FontColor("#64748b");
                col.Item().Text("Calle Principal Industrial #45-12, Bodega Central").FontSize(8).FontColor("#64748b");
                col.Item().Text("PBX: (+57) 601 555-0199 · soporte@firmeza.com").FontSize(8).FontColor("#64748b");
            });

            row.ConstantItem(200).Column(col =>
            {
                col.Item().Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(8).Column(card =>
                {
                    card.Item().Text("COMPROBANTE DE VENTA").FontSize(9).Bold().FontColor("#0891b2");
                    card.Item().Text(sale.SaleNumber).FontSize(13).ExtraBold().FontColor("#0f172a");
                    card.Item().PaddingTop(2).Text($"Fecha: {sale.Date.ToString("dd/MM/yyyy HH:mm", culture)}").FontSize(8);

                    var statusColor = sale.Status == SaleStatus.Cancelled ? "#ef4444" : "#10b981";
                    card.Item().Text($"Estado: {SaleStatusRules.Label(sale.Status)}").FontSize(8.5f).Bold().FontColor(statusColor);
                });
            });
        });
    }

    private static void ComposeContent(IContainer container, Sale sale, decimal subtotalBase, decimal tax, CultureInfo culture)
    {
        container.PaddingVertical(14).Column(col =>
        {
            // Panel de información del cliente
            col.Item().Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(8).Column(cust =>
            {
                cust.Item().Text("DATOS DEL CLIENTE / RECEPTOR").FontSize(8.5f).ExtraBold().FontColor("#0891b2");
                cust.Item().PaddingTop(3).Row(rowCust =>
                {
                    rowCust.RelativeItem().Column(colLeft =>
                    {
                        colLeft.Item().Text(t =>
                        {
                            t.Span("Cliente: ").Bold();
                            t.Span(sale.Customer?.Name ?? "Cliente General");
                        });
                        colLeft.Item().PaddingTop(2).Text(t =>
                        {
                            t.Span("Teléfono: ").Bold();
                            t.Span(sale.Customer?.Phone ?? "No registrado");
                        });
                        if (!string.IsNullOrWhiteSpace(sale.Customer?.Address))
                        {
                            colLeft.Item().PaddingTop(2).Text(t =>
                            {
                                t.Span("Dirección de entrega: ").Bold();
                                t.Span(sale.Customer.Address);
                            });
                        }
                    });

                    rowCust.RelativeItem().Column(colRight =>
                    {
                        colRight.Item().Text(t =>
                        {
                            t.Span("Correo: ").Bold();
                            t.Span(sale.Customer?.Email ?? "No registrado");
                        });
                    });
                });
            });

            col.Item().PaddingTop(12);

            // Tabla de productos
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(24);
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1.4f);
                    columns.RelativeColumn(1.4f);
                });

                table.Header(header =>
                {
                    header.Cell().Background("#0f172a").Padding(5).Text("#").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(5).Text("Descripción").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(5).AlignRight().Text("Cant.").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(5).AlignRight().Text("Precio Unit.").Bold().FontColor("#ffffff");
                    header.Cell().Background("#0f172a").Padding(5).AlignRight().Text("Subtotal").Bold().FontColor("#ffffff");
                });

                var idx = 1;
                foreach (var detail in sale.Details)
                {
                    var bg = idx % 2 == 0 ? "#f8fafc" : "#ffffff";
                    var lineTotal = detail.Quantity * detail.UnitPrice;

                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(idx.ToString());
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).Text(detail.Product?.Name ?? $"Material #{detail.ProductId}");
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(detail.Quantity.ToString());
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(detail.UnitPrice.ToString("C2", culture));
                    table.Cell().Background(bg).BorderBottom(1).BorderColor("#f1f5f9").Padding(5).AlignRight().Text(lineTotal.ToString("C2", culture));
                    idx++;
                }
            });

            col.Item().PaddingTop(12);

            // Totales
            col.Item().Row(row =>
            {
                row.RelativeItem().PaddingRight(20).Column(notes =>
                {
                    notes.Item().Text("Condiciones de garantía y despacho:").FontSize(8).Bold().FontColor("#64748b");
                    notes.Item().Text("• Material inspeccionado y garantizado conforme a normas NTC vigentes.").FontSize(7.5f).FontColor("#94a3b8");
                    notes.Item().Text("• Conserve este comprobante para recepciones en obra o reclamos.").FontSize(7.5f).FontColor("#94a3b8");
                });

                row.ConstantItem(220).Border(1).BorderColor("#e2e8f0").Background("#f8fafc").Padding(8).Column(totals =>
                {
                    totals.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Subtotal (Base):").FontSize(8.5f).FontColor("#475569");
                        r.RelativeItem().AlignRight().Text(subtotalBase.ToString("C2", culture)).FontSize(8.5f).Bold().FontColor("#334155");
                    });

                    totals.Item().PaddingTop(2).Row(r =>
                    {
                        r.RelativeItem().Text($"IVA ({InventoryCalculator.TaxRate:P0}):").FontSize(8.5f).FontColor("#475569");
                        r.RelativeItem().AlignRight().Text(tax.ToString("C2", culture)).FontSize(8.5f).Bold().FontColor("#334155");
                    });

                    totals.Item().PaddingTop(4).BorderTop(1).BorderColor("#cbd5e1").Row(r =>
                    {
                        r.RelativeItem().Text("TOTAL:").FontSize(10.5f).ExtraBold().FontColor("#0f172a");
                        r.RelativeItem().AlignRight().Text(sale.TotalAmount.ToString("C2", culture)).FontSize(11).ExtraBold().FontColor("#0891b2");
                    });
                });
            });
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.BorderTop(1).BorderColor("#e2e8f0").PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text("Documento digital generado por FIRMEZA HUD · Sistema ERP de Bodega").FontSize(7.5f).FontColor("#94a3b8");
            row.RelativeItem().AlignRight().Text(x =>
            {
                x.Span("Página ").FontSize(7.5f).FontColor("#94a3b8");
                x.CurrentPageNumber().FontSize(7.5f).FontColor("#94a3b8");
                x.Span(" de ").FontSize(7.5f).FontColor("#94a3b8");
                x.TotalPages().FontSize(7.5f).FontColor("#94a3b8");
            });
        });
    }

    private static byte[] GenerateFallbackPdf(Sale sale)
    {
        var breakdown = InventoryCalculator.SplitTaxInclusive(sale.TotalAmount);
        var streamContent = new System.Text.StringBuilder();
        streamContent.AppendLine("BT");
        streamContent.AppendLine("/F1 18 Tf 40 790 Td (FIRMEZA S.A.S.) Tj");
        streamContent.AppendLine("/F2 10 Tf 0 -18 Td (Materiales y Soluciones para la Construccion) Tj");
        streamContent.AppendLine("0 -14 Td (NIT: 900.543.210-9 - PBX: +57 601 555-0199) Tj");
        streamContent.AppendLine("/F1 12 Tf 0 -24 Td (COMPROBANTE DE VENTA: " + EscapePdf(sale.SaleNumber) + ") Tj");
        streamContent.AppendLine("/F2 10 Tf 0 -16 Td (Fecha: " + sale.Date.ToString("yyyy-MM-dd HH:mm") + ") Tj");
        streamContent.AppendLine("0 -16 Td (Cliente: " + EscapePdf(sale.Customer?.Name ?? "Cliente General") + ") Tj");
        streamContent.AppendLine("0 -14 Td (Documento: " + EscapePdf(sale.Customer?.Document ?? "N/A") + ") Tj");
        
        streamContent.AppendLine("/F1 10 Tf 0 -26 Td (--------------------------------------------------------------------------------------------------) Tj");
        streamContent.AppendLine("0 -16 Td (DESCRIPCION                                   CANT        VALOR UNIT        SUBTOTAL) Tj");
        streamContent.AppendLine("0 -12 Td (--------------------------------------------------------------------------------------------------) Tj");

        streamContent.AppendLine("/F2 10 Tf");
        if (sale.Details != null && sale.Details.Count > 0)
        {
            foreach (var d in sale.Details)
            {
                var pName = (d.Product?.Name ?? $"Item #{d.ProductId}").PadRight(38);
                if (pName.Length > 38) pName = pName.Substring(0, 35) + "...";
                var qty = d.Quantity.ToString().PadLeft(6);
                var unit = ("$" + d.UnitPrice.ToString("N0")).PadLeft(16);
                var sub = ("$" + (d.Quantity * d.UnitPrice).ToString("N0")).PadLeft(16);
                var line = $"{pName} {qty} {unit} {sub}";
                streamContent.AppendLine($"0 -16 Td ({EscapePdf(line)}) Tj");
            }
        }
        else
        {
            streamContent.AppendLine("0 -16 Td (Sin detalle de productos) Tj");
        }

        streamContent.AppendLine("/F1 10 Tf 0 -20 Td (--------------------------------------------------------------------------------------------------) Tj");
        streamContent.AppendLine($"/F2 10 Tf 0 -16 Td (Subtotal Neto: ${breakdown.SubtotalBase:N0}   |   IVA (19%): ${breakdown.Tax:N0}) Tj");
        streamContent.AppendLine($"/F1 13 Tf 0 -22 Td (TOTAL A PAGAR: ${sale.TotalAmount:N0} COP) Tj");
        streamContent.AppendLine("/F2 8 Tf 0 -35 Td (Documento generado por el ERP Firmeza. Valido como soporte de entrega y despacho.) Tj");
        streamContent.AppendLine("ET");

        var streamBytes = System.Text.Encoding.ASCII.GetBytes(streamContent.ToString());

        var objects = new System.Collections.Generic.List<string>
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            $"<< /Length {streamBytes.Length} >>\nstream\n{streamContent}\nendstream"
        };

        using var ms = new System.IO.MemoryStream();
        using (var writer = new System.IO.StreamWriter(ms, System.Text.Encoding.ASCII, leaveOpen: true))
        {
            writer.Write("%PDF-1.4\n");
            writer.Flush();

            var offsets = new System.Collections.Generic.List<long>();
            for (int i = 0; i < objects.Count; i++)
            {
                offsets.Add(ms.Position);
                writer.Write($"{i + 1} 0 obj\n{objects[i]}\nendobj\n");
                writer.Flush();
            }

            var startXref = ms.Position;
            writer.Write($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n");
            foreach (var offset in offsets)
            {
                writer.Write($"{offset:D10} 00000 n \n");
            }
            writer.Write($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{startXref}\n%%EOF\n");
            writer.Flush();
        }

        return ms.ToArray();
    }

    private static string EscapePdf(string text)
    {
        if (string.IsNullOrEmpty(text)) return "";
        var sb = new System.Text.StringBuilder();
        foreach (var c in text.Normalize(System.Text.NormalizationForm.FormD))
        {
            if (c == '\\') sb.Append("\\\\");
            else if (c == '(') sb.Append("\\(");
            else if (c == ')') sb.Append("\\)");
            else if ((int)c < 128) sb.Append(c);
        }
        return sb.ToString();
    }

    public string SaveReceiptToDisk(Sale sale, byte[] pdfBytes, string? customPath = null)
    {
        try
        {
            var baseDir = customPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "recibos");
            if (!Directory.Exists(baseDir))
            {
                Directory.CreateDirectory(baseDir);
            }

            var safeSaleNumber = string.IsNullOrWhiteSpace(sale.SaleNumber) ? $"FZ-{sale.Id}" : sale.SaleNumber;
            var fileName = $"recibo_{safeSaleNumber}.pdf";
            var fullPath = Path.Combine(baseDir, fileName);

            File.WriteAllBytes(fullPath, pdfBytes);
            return fullPath;
        }
        catch
        {
            return string.Empty;
        }
    }

    public byte[]? GetReceiptFromDisk(string saleNumber, string? customPath = null)
    {
        try
        {
            var baseDir = customPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "recibos");
            var fileName = $"recibo_{saleNumber}.pdf";
            var fullPath = Path.Combine(baseDir, fileName);

            if (File.Exists(fullPath))
            {
                return File.ReadAllBytes(fullPath);
            }
        }
        catch { }

        return null;
    }
}
