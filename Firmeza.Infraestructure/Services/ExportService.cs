using System;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Firmeza.Application.Services.Export;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Services;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Firmeza.Infraestructure.Services;

public class ExportService : IExportService
{
    private readonly ApplicationDbContext _context;

    static ExportService()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public ExportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportProductsToExcelAsync()
    {
        var products = await _context.Products.OrderBy(p => p.Name).ToListAsync();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Productos");

        string[] headers = { "ID", "SKU / Ref", "Nombre del Producto", "Precio Unitario (COP)", "Stock Actual", "Stock Mínimo", "Unidad", "Estado" };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cells[1, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(14, 116, 144));
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        int row = 2;
        foreach (var p in products)
        {
            ws.Cells[row, 1].Value = p.Id;
            ws.Cells[row, 2].Value = string.IsNullOrWhiteSpace(p.Sku) ? $"FZ-{p.Id:D4}" : p.Sku;
            ws.Cells[row, 3].Value = p.Name;
            ws.Cells[row, 4].Value = p.Price;
            ws.Cells[row, 4].Style.Numberformat.Format = "$#,##0";
            ws.Cells[row, 5].Value = p.Stock;
            ws.Cells[row, 6].Value = p.MinStock;
            ws.Cells[row, 7].Value = p.Unit;
            ws.Cells[row, 8].Value = p.Stock <= p.MinStock ? "CRÍTICO" : "ÓPTIMO";
            
            if (p.Stock <= p.MinStock)
            {
                ws.Cells[row, 8].Style.Font.Color.SetColor(Color.DarkRed);
                ws.Cells[row, 8].Style.Font.Bold = true;
            }

            row++;
        }

        ws.Cells.AutoFitColumns();
        return package.GetAsByteArray();
    }

    public async Task<byte[]> ExportProductsToPdfAsync()
    {
        var products = await _context.Products.OrderBy(p => p.Name).ToListAsync();
        var culture = new CultureInfo("es-CO");
        decimal totalInventoryValue = products.Sum(p => p.Price * p.Stock);
        int totalUnits = products.Sum(p => p.Stock);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                // Header
                page.Header().Column(col =>
                {
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text("FIRMEZA S.A.S. - REPORTE DE INVENTARIO").FontSize(16).ExtraBold().FontColor("#0891b2");
                            c.Item().Text("Catálogo General de Materiales y Existencias en Bodega").FontSize(9).FontColor("#64748b");
                        });
                        r.ConstantItem(200).AlignRight().Column(c =>
                        {
                            c.Item().Text($"Fecha: {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC").FontSize(8.5f).FontColor("#64748b");
                            c.Item().Text($"Ítems: {products.Count} | Unidades: {totalUnits}").FontSize(8.5f).SemiBold();
                            c.Item().Text($"Valorización: ${totalInventoryValue.ToString("N0", culture)} COP").FontSize(8.5f).Bold().FontColor("#0891b2");
                        });
                    });
                    col.Item().PaddingTop(8).LineHorizontal(1.5f).LineColor("#cbd5e1");
                });

                // Content Table
                page.Content().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.ConstantColumn(30);  // #
                        cols.ConstantColumn(80);  // Sku
                        cols.RelativeColumn(3);   // Nombre
                        cols.ConstantColumn(60);  // Unidad
                        cols.ConstantColumn(80);  // Precio Unit
                        cols.ConstantColumn(60);  // Stock
                        cols.ConstantColumn(60);  // Mínimo
                        cols.ConstantColumn(70);  // Estado
                    });

                    table.Header(h =>
                    {
                        h.Cell().Background("#f1f5f9").Padding(5).Text("#").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).Text("SKU").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).Text("PRODUCTO").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).Text("UNIDAD").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignRight().Text("PRECIO").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignRight().Text("STOCK").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignRight().Text("MÍN").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignCenter().Text("ESTADO").Bold().FontSize(8.5f);
                    });

                    int idx = 1;
                    foreach (var p in products)
                    {
                        var bg = idx % 2 == 0 ? "#f8fafc" : "#ffffff";
                        bool isCritical = p.Stock <= p.MinStock;

                        table.Cell().Background(bg).Padding(5).Text(idx.ToString());
                        table.Cell().Background(bg).Padding(5).Text(string.IsNullOrWhiteSpace(p.Sku) ? $"FZ-{p.Id:D4}" : p.Sku).FontSize(8);
                        table.Cell().Background(bg).Padding(5).Text(p.Name).SemiBold();
                        table.Cell().Background(bg).Padding(5).Text(p.Unit);
                        table.Cell().Background(bg).Padding(5).AlignRight().Text($"${p.Price.ToString("N0", culture)}");
                        table.Cell().Background(bg).Padding(5).AlignRight().Text(p.Stock.ToString()).Bold();
                        table.Cell().Background(bg).Padding(5).AlignRight().Text(p.MinStock.ToString());
                        
                        var statusCell = table.Cell().Background(bg).Padding(5).AlignCenter();
                        if (isCritical)
                            statusCell.Text("CRÍTICO").Bold().FontColor("#dc2626").FontSize(7.5f);
                        else
                            statusCell.Text("ÓPTIMO").FontColor("#16a34a").FontSize(7.5f);

                        idx++;
                    }
                });

                // Footer
                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("FIRMEZA S.A.S. · Documento oficial de inventario · Página ");
                    t.CurrentPageNumber();
                    t.Span(" de ");
                    t.TotalPages();
                });
            });
        });

        return doc.GeneratePdf();
    }

    public async Task<byte[]> ExportCustomersToExcelAsync()
    {
        var customers = await _context.Customers.OrderBy(c => c.Name).ToListAsync();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Clientes");

        string[] headers = { "ID", "Documento / NIT", "Nombre / Razón Social", "Correo Electrónico", "Teléfono", "Edad" };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cells[1, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(14, 116, 144));
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        int row = 2;
        foreach (var c in customers)
        {
            ws.Cells[row, 1].Value = c.Id;
            ws.Cells[row, 2].Value = c.Document;
            ws.Cells[row, 3].Value = c.Name;
            ws.Cells[row, 4].Value = c.Email ?? "N/A";
            ws.Cells[row, 5].Value = c.Phone ?? "N/A";
            ws.Cells[row, 6].Value = c.Age > 0 ? c.Age.ToString() : "N/A";
            row++;
        }

        ws.Cells.AutoFitColumns();
        return package.GetAsByteArray();
    }

    public async Task<byte[]> ExportSalesToExcelAsync()
    {
        var sales = await _context.Sales
            .Include(s => s.Customer)
            .Include(s => s.Details)
            .OrderByDescending(s => s.Date)
            .ToListAsync();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Ventas");

        string[] headers = { "N° Venta / Factura", "Fecha", "Doc. Cliente", "Cliente", "Ítems", "Subtotal Base (COP)", "IVA 19% (COP)", "Total Factura (COP)", "Estado" };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cells[1, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(14, 116, 144));
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        }

        int row = 2;
        foreach (var s in sales)
        {
            var breakdown = InventoryCalculator.SplitTaxInclusive(s.TotalAmount);

            ws.Cells[row, 1].Value = s.SaleNumber;
            ws.Cells[row, 2].Value = s.Date.ToString("yyyy-MM-dd HH:mm");
            ws.Cells[row, 3].Value = s.Customer?.Document ?? "N/A";
            ws.Cells[row, 4].Value = s.Customer?.Name ?? "Cliente Mostrador";
            ws.Cells[row, 5].Value = s.Details.Sum(d => d.Quantity);
            ws.Cells[row, 6].Value = breakdown.SubtotalBase;
            ws.Cells[row, 6].Style.Numberformat.Format = "$#,##0";
            ws.Cells[row, 7].Value = breakdown.Tax;
            ws.Cells[row, 7].Style.Numberformat.Format = "$#,##0";
            ws.Cells[row, 8].Value = s.TotalAmount;
            ws.Cells[row, 8].Style.Numberformat.Format = "$#,##0";
            ws.Cells[row, 9].Value = s.Status.ToString();
            row++;
        }

        ws.Cells.AutoFitColumns();
        return package.GetAsByteArray();
    }

    public async Task<byte[]> ExportSalesToPdfAsync()
    {
        var sales = await _context.Sales
            .Include(s => s.Customer)
            .Include(s => s.Details)
            .OrderByDescending(s => s.Date)
            .ToListAsync();

        var culture = new CultureInfo("es-CO");
        decimal totalSalesRevenue = sales.Sum(s => s.TotalAmount);
        int totalTransactions = sales.Count;

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1e293b"));

                // Header
                page.Header().Column(col =>
                {
                    col.Item().Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text("FIRMEZA S.A.S. - REPORTE DE VENTAS").FontSize(16).ExtraBold().FontColor("#0891b2");
                            c.Item().Text("Historial Consolidado de Facturación y Salida de Materiales").FontSize(9).FontColor("#64748b");
                        });
                        r.ConstantItem(220).AlignRight().Column(c =>
                        {
                            c.Item().Text($"Generado: {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC").FontSize(8.5f).FontColor("#64748b");
                            c.Item().Text($"Transacciones: {totalTransactions}").FontSize(8.5f).SemiBold();
                            c.Item().Text($"Total Facturado: ${totalSalesRevenue.ToString("N0", culture)} COP").FontSize(8.5f).Bold().FontColor("#0891b2");
                        });
                    });
                    col.Item().PaddingTop(8).LineHorizontal(1.5f).LineColor("#cbd5e1");
                });

                // Content Table
                page.Content().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.ConstantColumn(85);   // N° Factura
                        cols.ConstantColumn(80);   // Fecha
                        cols.ConstantColumn(75);   // Doc Cliente
                        cols.RelativeColumn(3);    // Nombre Cliente
                        cols.ConstantColumn(45);   // Ítems
                        cols.ConstantColumn(75);   // Subtotal
                        cols.ConstantColumn(70);   // IVA 19%
                        cols.ConstantColumn(80);   // Total
                        cols.ConstantColumn(65);   // Estado
                    });

                    table.Header(h =>
                    {
                        h.Cell().Background("#f1f5f9").Padding(5).Text("FACTURA").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).Text("FECHA").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).Text("DOC. NIT").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).Text("CLIENTE").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignCenter().Text("ÍTEMS").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignRight().Text("SUBTOTAL").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignRight().Text("IVA (19%)").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignRight().Text("TOTAL").Bold().FontSize(8.5f);
                        h.Cell().Background("#f1f5f9").Padding(5).AlignCenter().Text("ESTADO").Bold().FontSize(8.5f);
                    });

                    int idx = 0;
                    foreach (var s in sales)
                    {
                        var bg = idx % 2 == 0 ? "#f8fafc" : "#ffffff";
                        var breakdown = InventoryCalculator.SplitTaxInclusive(s.TotalAmount);

                        table.Cell().Background(bg).Padding(5).Text(s.SaleNumber).Bold().FontSize(8);
                        table.Cell().Background(bg).Padding(5).Text(s.Date.ToString("dd/MM/yyyy HH:mm")).FontSize(8);
                        table.Cell().Background(bg).Padding(5).Text(s.Customer?.Document ?? "N/A").FontSize(8);
                        table.Cell().Background(bg).Padding(5).Text(s.Customer?.Name ?? "Cliente Mostrador");
                        table.Cell().Background(bg).Padding(5).AlignCenter().Text(s.Details.Sum(d => d.Quantity).ToString());
                        table.Cell().Background(bg).Padding(5).AlignRight().Text($"${breakdown.SubtotalBase.ToString("N0", culture)}");
                        table.Cell().Background(bg).Padding(5).AlignRight().Text($"${breakdown.Tax.ToString("N0", culture)}");
                        table.Cell().Background(bg).Padding(5).AlignRight().Text($"${s.TotalAmount.ToString("N0", culture)}").Bold();
                        table.Cell().Background(bg).Padding(5).AlignCenter().Text(s.Status.ToString()).FontSize(8);

                        idx++;
                    }
                });

                // Footer
                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("FIRMEZA S.A.S. · Reporte financiero confidencial · Página ");
                    t.CurrentPageNumber();
                    t.Span(" de ");
                    t.TotalPages();
                });
            });
        });

        return doc.GeneratePdf();
    }
}
