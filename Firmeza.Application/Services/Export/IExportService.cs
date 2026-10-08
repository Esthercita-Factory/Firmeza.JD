using System.Threading.Tasks;

namespace Firmeza.Application.Services.Export;

public interface IExportService
{
    Task<byte[]> ExportProductsToExcelAsync();
    Task<byte[]> ExportProductsToPdfAsync();
    Task<byte[]> ExportCustomersToExcelAsync();
    Task<byte[]> ExportSalesToExcelAsync();
    Task<byte[]> ExportSalesToPdfAsync();
}
