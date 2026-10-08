using System.Collections.Generic;

namespace Firmeza.Application.Dtos.Import;

public class ExcelImportResultDto
{
    public bool Success { get; set; }
    public int TotalRows { get; set; }
    public int ProductsImported { get; set; }
    public int ProductsUpdated { get; set; }
    public int CustomersImported { get; set; }
    public int CustomersUpdated { get; set; }
    public int SalesImported { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> Summary { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}
