using System.IO;
using Firmeza.Infraestructure.Services;
using OfficeOpenXml;
using Xunit;

namespace Firmeza.Tests;

public class ExcelImportTests
{
    static ExcelImportTests()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    [Fact]
    public void GenerateSampleTemplate_Should_Produce_Valid_Excel_With_Mixed_Data()
    {
        var service = new ExcelImportService(null!);

        var bytes = service.GenerateSampleTemplate();

        Assert.NotNull(bytes);
        Assert.True(bytes.Length > 1000, "La plantilla debe contener bytes válidos");

        using var ms = new MemoryStream(bytes);
        using var package = new ExcelPackage(ms);

        var ws = package.Workbook.Worksheets[0];
        Assert.NotNull(ws);
        Assert.Equal("Carga Masiva Desnormalizada", ws.Name);

        // Verificar columnas clave
        var col1 = ws.Cells[1, 1].Value?.ToString();
        var col7 = ws.Cells[1, 7].Value?.ToString();
        Assert.Contains("Cliente", col1);
        Assert.Contains("Producto", col7);

        // Al menos 5 filas de datos de ejemplo
        Assert.True(ws.Dimension.Rows >= 5);
    }

    [Fact]
    public async void ImportFromStreamAsync_With_Empty_Stream_Should_Fail_Gracefully()
    {
        var service = new ExcelImportService(null!);

        using var emptyMs = new MemoryStream();
        var result = await service.ImportFromStreamAsync(emptyMs);

        Assert.False(result.Success);
        Assert.NotEmpty(result.Errors);
    }
}
