using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Firmeza.Application.Dtos.Import;
using Firmeza.Application.Services.Import;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace Firmeza.Infraestructure.Services;

public class ExcelImportService : IExcelImportService
{
    private readonly ApplicationDbContext _context;

    public ExcelImportService(ApplicationDbContext context)
    {
        _context = context;
        // EPPlus license now configured in appsettings.json
    }

    public async Task<ExcelImportResultDto> ImportFromStreamAsync(Stream stream)
    {
        var result = new ExcelImportResultDto();

        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();

        if (worksheet == null || worksheet.Dimension == null)
        {
            result.Success = false;
            result.Errors.Add("El archivo Excel está vacío o no contiene hojas de cálculo legibles.");
            result.Message = "Archivo vacío o inválido.";
            return result;
        }

        int totalRows = worksheet.Dimension.Rows;
        int totalCols = worksheet.Dimension.Columns;

        if (totalRows < 2)
        {
            result.Success = false;
            result.Errors.Add("El archivo debe contener al menos una fila de encabezados y una fila de datos.");
            result.Message = "No hay datos para procesar.";
            return result;
        }

        // 1. Mapeo dinámico de columnas por encabezados
        var headerMap = DetectHeaders(worksheet, totalCols);
        if (headerMap.Count == 0)
        {
            result.Success = false;
            result.Errors.Add("No se pudieron identificar columnas reconocibles de productos, clientes o ventas.");
            result.Message = "Formato de columnas no reconocido.";
            return result;
        }

        // Estructuras temporales para normalización en memoria
        var stagedCustomers = new Dictionary<string, StagedCustomer>(StringComparer.OrdinalIgnoreCase);
        var stagedProducts = new Dictionary<string, StagedProduct>(StringComparer.OrdinalIgnoreCase);
        var stagedSales = new List<StagedSaleItem>();

        int processedRowCount = 0;

        for (int row = 2; row <= totalRows; row++)
        {
            if (IsRowEmpty(worksheet, row, totalCols))
                continue;

            processedRowCount++;

            // --- A. Extracción de Cliente ---
            string? custDoc = GetCell(worksheet, row, headerMap, "cust_doc");
            string? custName = GetCell(worksheet, row, headerMap, "cust_name");
            string? custEmail = GetCell(worksheet, row, headerMap, "cust_email");
            string? custPhone = GetCell(worksheet, row, headerMap, "cust_phone");
            string? custAgeStr = GetCell(worksheet, row, headerMap, "cust_age");

            // Si hay datos de cliente
            if (!string.IsNullOrWhiteSpace(custDoc) || !string.IsNullOrWhiteSpace(custName) || !string.IsNullOrWhiteSpace(custEmail))
            {
                if (string.IsNullOrWhiteSpace(custDoc))
                {
                    result.Errors.Add($"Fila {row}: Se detectó información de cliente pero falta el documento/NIT obligatorio.");
                }
                else if (string.IsNullOrWhiteSpace(custName))
                {
                    result.Errors.Add($"Fila {row}: Se detectó documento de cliente ({custDoc}) pero el nombre es obligatorio.");
                }
                else
                {
                    int age = 30;
                    if (!string.IsNullOrWhiteSpace(custAgeStr) && int.TryParse(custAgeStr, out int parsedAge))
                    {
                        if (parsedAge < 18)
                        {
                            result.Warnings.Add($"Fila {row}: La edad ({parsedAge}) para '{custName}' fue ajustada al mínimo legal de 18 años.");
                            age = 18;
                        }
                        else if (parsedAge > 120)
                        {
                            result.Warnings.Add($"Fila {row}: La edad ({parsedAge}) fuera de rango, ajustada a 65 años.");
                            age = 65;
                        }
                        else
                        {
                            age = parsedAge;
                        }
                    }

                    if (!stagedCustomers.TryGetValue(custDoc, out var existingStagedCust))
                    {
                        stagedCustomers[custDoc] = new StagedCustomer
                        {
                            Document = custDoc,
                            Name = custName,
                            Email = custEmail,
                            Phone = custPhone,
                            Age = age,
                            SourceRow = row
                        };
                    }
                    else
                    {
                        // Enriquecer datos si estaban vacíos
                        if (string.IsNullOrWhiteSpace(existingStagedCust.Email) && !string.IsNullOrWhiteSpace(custEmail)) existingStagedCust.Email = custEmail;
                        if (string.IsNullOrWhiteSpace(existingStagedCust.Phone) && !string.IsNullOrWhiteSpace(custPhone)) existingStagedCust.Phone = custPhone;
                    }
                }
            }

            // --- B. Extracción de Producto ---
            string? prodName = GetCell(worksheet, row, headerMap, "prod_name");
            string? prodSku = GetCell(worksheet, row, headerMap, "prod_sku");
            string? prodPriceStr = GetCell(worksheet, row, headerMap, "prod_price");
            string? prodStockStr = GetCell(worksheet, row, headerMap, "prod_stock");
            string? prodUnit = GetCell(worksheet, row, headerMap, "prod_unit") ?? "Unidad";
            string? prodMinStockStr = GetCell(worksheet, row, headerMap, "prod_min_stock");

            bool hasProductData = !string.IsNullOrWhiteSpace(prodName) || !string.IsNullOrWhiteSpace(prodSku) || !string.IsNullOrWhiteSpace(prodPriceStr);

            if (hasProductData)
            {
                if (string.IsNullOrWhiteSpace(prodName))
                {
                    result.Errors.Add($"Fila {row}: El nombre del producto es obligatorio.");
                }
                else
                {
                    decimal price = 0;
                    if (!TryParseDecimal(prodPriceStr, out price) || price <= 0)
                    {
                        result.Errors.Add($"Fila {row}: El precio del producto '{prodName}' debe ser un valor numérico mayor a 0 (recibido: '{prodPriceStr}').");
                    }
                    else
                    {
                        int stock = 0;
                        if (!string.IsNullOrWhiteSpace(prodStockStr))
                        {
                            int.TryParse(prodStockStr, out stock);
                            if (stock < 0) stock = 0;
                        }

                        int minStock = 10;
                        if (!string.IsNullOrWhiteSpace(prodMinStockStr))
                        {
                            int.TryParse(prodMinStockStr, out minStock);
                            if (minStock < 0) minStock = 5;
                        }

                        string effectiveSku = string.IsNullOrWhiteSpace(prodSku) 
                            ? "SKU-" + Regex.Replace(prodName.ToUpper(), @"[^A-Z0-9]", "").Substring(0, Math.Min(8, prodName.Length))
                            : prodSku.Trim();

                        string prodKey = prodName.Trim();

                        if (!stagedProducts.TryGetValue(prodKey, out var existingStagedProd))
                        {
                            stagedProducts[prodKey] = new StagedProduct
                            {
                                Name = prodName.Trim(),
                                Sku = effectiveSku,
                                Price = price,
                                Stock = stock,
                                Unit = prodUnit.Trim(),
                                MinStock = minStock,
                                SourceRow = row
                            };
                        }
                        else
                        {
                            // Si se repite en el archivo, sumamos inventario y actualizamos precio
                            existingStagedProd.Stock += stock;
                            existingStagedProd.Price = price;
                        }
                    }
                }
            }

            // --- C. Extracción de Venta / Transacción ---
            string? saleQtyStr = GetCell(worksheet, row, headerMap, "sale_qty");
            string? saleNum = GetCell(worksheet, row, headerMap, "sale_number");
            string? saleDateStr = GetCell(worksheet, row, headerMap, "sale_date");

            if (!string.IsNullOrWhiteSpace(saleQtyStr) && int.TryParse(saleQtyStr, out int qty) && qty > 0)
            {
                if (string.IsNullOrWhiteSpace(custDoc))
                {
                    result.Errors.Add($"Fila {row}: Se especificó cantidad vendida ({qty}) pero falta el documento del cliente.");
                }
                else if (string.IsNullOrWhiteSpace(prodName))
                {
                    result.Errors.Add($"Fila {row}: Se especificó cantidad vendida ({qty}) pero falta el nombre del producto.");
                }
                else
                {
                    DateTime saleDate = DateTime.UtcNow;
                    if (!string.IsNullOrWhiteSpace(saleDateStr) && DateTime.TryParse(saleDateStr, out var parsedDate))
                    {
                        saleDate = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);
                    }

                    string effectiveSaleNum = string.IsNullOrWhiteSpace(saleNum)
                        ? $"IMP-{saleDate:yyyyMMdd}-{custDoc.Trim()}"
                        : saleNum.Trim();

                    stagedSales.Add(new StagedSaleItem
                    {
                        SaleNumber = effectiveSaleNum,
                        CustomerDoc = custDoc.Trim(),
                        ProductName = prodName.Trim(),
                        Quantity = qty,
                        Date = saleDate,
                        SourceRow = row
                    });
                }
            }
        }

        result.TotalRows = processedRowCount;

        // 2. Persistencia y normalización en Base de Datos

        // A. Sincronizar Clientes
        var existingCustomers = await _context.Customers.ToListAsync();
        var customerMap = new Dictionary<string, Customer>(StringComparer.OrdinalIgnoreCase);

        foreach (var c in existingCustomers)
        {
            if (!string.IsNullOrWhiteSpace(c.Document))
                customerMap[c.Document.Trim()] = c;
        }

        foreach (var staged in stagedCustomers.Values)
        {
            if (customerMap.TryGetValue(staged.Document, out var dbCust))
            {
                // Actualizar si hay nuevos datos
                bool changed = false;
                if (!string.IsNullOrWhiteSpace(staged.Name) && dbCust.Name != staged.Name) { dbCust.Name = staged.Name; changed = true; }
                if (!string.IsNullOrWhiteSpace(staged.Email) && dbCust.Email != staged.Email) { dbCust.Email = staged.Email; changed = true; }
                if (!string.IsNullOrWhiteSpace(staged.Phone) && dbCust.Phone != staged.Phone) { dbCust.Phone = staged.Phone; changed = true; }
                if (staged.Age > 0 && dbCust.Age != staged.Age) { dbCust.Age = staged.Age; changed = true; }

                if (changed)
                {
                    result.CustomersUpdated++;
                }
            }
            else
            {
                var newCust = new Customer
                {
                    Document = staged.Document,
                    Name = staged.Name,
                    Email = staged.Email,
                    Phone = staged.Phone,
                    Age = staged.Age
                };
                _context.Customers.Add(newCust);
                customerMap[staged.Document] = newCust;
                result.CustomersImported++;
            }
        }

        await _context.SaveChangesAsync();

        // B. Sincronizar Productos
        var existingProducts = await _context.Products.ToListAsync();
        var productMap = new Dictionary<string, Product>(StringComparer.OrdinalIgnoreCase);

        foreach (var p in existingProducts)
        {
            productMap[p.Name.Trim()] = p;
        }

        foreach (var staged in stagedProducts.Values)
        {
            if (productMap.TryGetValue(staged.Name, out var dbProd))
            {
                dbProd.Price = staged.Price;
                dbProd.Stock += staged.Stock;
                dbProd.MinStock = staged.MinStock;
                dbProd.Unit = staged.Unit;
                if (!string.IsNullOrWhiteSpace(staged.Sku)) dbProd.Sku = staged.Sku;

                result.ProductsUpdated++;
            }
            else
            {
                var newProd = new Product
                {
                    Name = staged.Name,
                    Price = staged.Price,
                    Stock = staged.Stock,
                    MinStock = staged.MinStock,
                    Unit = staged.Unit,
                    Sku = staged.Sku
                };
                _context.Products.Add(newProd);
                productMap[staged.Name] = newProd;
                result.ProductsImported++;
            }
        }

        await _context.SaveChangesAsync();

        // C. Sincronizar Ventas desnormalizadas
        if (stagedSales.Count > 0)
        {
            var salesGrouped = stagedSales.GroupBy(s => s.SaleNumber);

            foreach (var group in salesGrouped)
            {
                var first = group.First();
                if (!customerMap.TryGetValue(first.CustomerDoc, out var customer))
                {
                    result.Warnings.Add($"No se pudo registrar la venta '{group.Key}' porque el cliente '{first.CustomerDoc}' no se pudo asociar.");
                    continue;
                }

                var sale = new Sale
                {
                    SaleNumber = group.Key,
                    CustomerId = customer.Id,
                    Date = first.Date,
                    Status = SaleStatus.Confirmed,
                    HasStockDeducted = true
                };

                decimal total = 0;
                foreach (var item in group)
                {
                    if (productMap.TryGetValue(item.ProductName, out var prod))
                    {
                        var detail = new SaleDetail
                        {
                            ProductId = prod.Id,
                            Quantity = item.Quantity,
                            UnitPrice = prod.Price
                        };
                        sale.Details.Add(detail);
                        total += item.Quantity * prod.Price;

                        // Descontar inventario
                        prod.Stock = Math.Max(0, prod.Stock - item.Quantity);
                    }
                    else
                    {
                        result.Warnings.Add($"Ítem '{item.ProductName}' en venta '{group.Key}' no encontrado en catálogo.");
                    }
                }

                if (sale.Details.Count > 0)
                {
                    sale.TotalAmount = total;
                    _context.Sales.Add(sale);
                    result.SalesImported++;
                }
            }

            await _context.SaveChangesAsync();
        }

        result.Success = result.Errors.Count == 0;
        result.Summary.Add($"Filas procesadas: {result.TotalRows}");
        result.Summary.Add($"Productos: {result.ProductsImported} creados, {result.ProductsUpdated} actualizados");
        result.Summary.Add($"Clientes: {result.CustomersImported} creados, {result.CustomersUpdated} actualizados");
        result.Summary.Add($"Ventas consolidadas: {result.SalesImported}");

        result.Message = result.Success
            ? $"Importación exitosa. Se procesaron {result.TotalRows} filas sin errores críticos."
            : $"Importación completada con {result.Errors.Count} advertencia(s)/error(es). Se registraron los datos válidos.";

        return result;
    }

    public byte[] GenerateSampleTemplate()
    {
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Carga Masiva Desnormalizada");

        // Encabezados
        string[] headers = {
            "Cliente_Documento", "Cliente_Nombre", "Cliente_Email", "Cliente_Telefono", "Cliente_Edad",
            "Producto_SKU", "Producto_Nombre", "Precio_Unitario", "Stock_Actual", "Unidad", "Stock_Minimo",
            "Venta_Cantidad", "Factura_Numero", "Fecha_Venta"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cells[1, i + 1];
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(System.Drawing.Color.White);
            cell.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.FromArgb(14, 116, 144)); // Cyan/Teal HUD
            cell.Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
        }

        // Datos de ejemplo desnormalizados (productos, clientes y compras mezclados)
        object[,] sampleData = {
            { "900543210", "Constructora Los Andes S.A.S", "compras@losandes.com", "3001234567", 35, "CEM-ARG-50", "Cemento Gris Argos Tipo 1 (50kg)", 34500, 200, "Bolsa", 30, 25, "FZ-2026-9001", "2026-10-07" },
            { "900543210", "Constructora Los Andes S.A.S", "compras@losandes.com", "3001234567", 35, "VAR-COR-12", "Varilla Corrugada 1/2\" x 6m W60", 29800, 500, "Unidad", 50, 10, "FZ-2026-9001", "2026-10-07" },
            { "79876543", "Maestro Juan Carlos Pérez", "juan.perez@gmail.com", "3154567890", 48, "ARE-RIO-M3", "Arena de Río Lavada (M3)", 72000, 40, "M3", 10, 5, "FZ-2026-9002", "2026-10-06" },
            { "900987654", "Inversiones Bogotá y Cía.", "proyectos@invbogota.com", "3109876543", 42, "LAD-FAR-10", "Ladrillo Farol Limpio 10x20x30", 1850, 6000, "Millar", 600, 1200, "FZ-2026-9003", "2026-10-05" },
            { "1018456789", "Arquitectura Moderna S.A.S", "arqui@moderna.co", "3208765432", 33, "GRA-TRI-M3", "Grava Triturada 1/2\" (M3)", 85000, 35, "M3", 10, 0, "", "" }
        };

        for (int r = 0; r < sampleData.GetLength(0); r++)
        {
            for (int c = 0; c < sampleData.GetLength(1); c++)
            {
                ws.Cells[r + 2, c + 1].Value = sampleData[r, c];
            }
        }

        ws.Cells.AutoFitColumns();
        return package.GetAsByteArray();
    }

    private static Dictionary<string, int> DetectHeaders(ExcelWorksheet ws, int cols)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (int c = 1; c <= cols; c++)
        {
            string? val = ws.Cells[1, c].Value?.ToString();
            if (string.IsNullOrWhiteSpace(val)) continue;

            string norm = Regex.Replace(val.ToLower().Trim(), @"[^a-z0-9]", "");

            // Cliente
            if (norm.Contains("doc") || norm.Contains("cedula") || norm.Contains("nit") || norm.Contains("identificacion"))
                map["cust_doc"] = c;
            else if (norm.Contains("cliente") || norm.Contains("comprador") || norm.Contains("razonsocial"))
                map["cust_name"] = c;
            else if (norm.Contains("email") || norm.Contains("correo"))
                map["cust_email"] = c;
            else if (norm.Contains("tel") || norm.Contains("celular") || norm.Contains("phone"))
                map["cust_phone"] = c;
            else if (norm == "edad" || norm == "age")
                map["cust_age"] = c;

            // Producto
            else if (norm.Contains("sku") || norm.Contains("ref") || norm.Contains("codigo"))
                map["prod_sku"] = c;
            else if (norm.Contains("producto") || norm.Contains("material") || norm.Contains("articulo") || norm.Contains("descripcion"))
                map["prod_name"] = c;
            else if (norm.Contains("precio") || norm.Contains("valor") || norm.Contains("unitario") || norm.Contains("costo"))
                map["prod_price"] = c;
            else if (norm.Contains("minstock") || norm.Contains("stockmin"))
                map["prod_min_stock"] = c;
            else if (norm.Contains("stock") || norm.Contains("existencia") || norm.Contains("inventario"))
                map["prod_stock"] = c;
            else if (norm.Contains("unidad") || norm.Contains("medida"))
                map["prod_unit"] = c;

            // Venta
            else if (norm.Contains("cantidad") || norm.Contains("cant") || norm.Contains("unidades") || norm.Contains("qty"))
                map["sale_qty"] = c;
            else if (norm.Contains("factura") || norm.Contains("venta") || norm.Contains("consecutivo") || norm.Contains("numero"))
                map["sale_number"] = c;
            else if (norm.Contains("fecha") || norm.Contains("date"))
                map["sale_date"] = c;
        }

        return map;
    }

    private static string? GetCell(ExcelWorksheet ws, int row, Dictionary<string, int> map, string key)
    {
        if (map.TryGetValue(key, out int col))
        {
            return ws.Cells[row, col].Value?.ToString()?.Trim();
        }
        return null;
    }

    private static bool IsRowEmpty(ExcelWorksheet ws, int row, int cols)
    {
        for (int c = 1; c <= cols; c++)
        {
            if (!string.IsNullOrWhiteSpace(ws.Cells[row, c].Value?.ToString()))
                return false;
        }
        return true;
    }

    private static bool TryParseDecimal(string? s, out decimal val)
    {
        val = 0;
        if (string.IsNullOrWhiteSpace(s)) return false;

        string clean = s.Replace("$", "").Replace("COP", "").Replace(" ", "").Trim();
        if (decimal.TryParse(clean, NumberStyles.Any, CultureInfo.InvariantCulture, out val))
            return true;
        return decimal.TryParse(clean, NumberStyles.Any, new CultureInfo("es-CO"), out val);
    }

    private class StagedCustomer
    {
        public string Document { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public int Age { get; set; }
        public int SourceRow { get; set; }
    }

    private class StagedProduct
    {
        public string Name { get; set; } = string.Empty;
        public string Sku { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public int MinStock { get; set; }
        public string Unit { get; set; } = "Unidad";
        public int SourceRow { get; set; }
    }

    private class StagedSaleItem
    {
        public string SaleNumber { get; set; } = string.Empty;
        public string CustomerDoc { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public DateTime Date { get; set; }
        public int SourceRow { get; set; }
    }
}
