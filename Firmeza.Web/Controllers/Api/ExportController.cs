using System.Threading.Tasks;
using Firmeza.Application.Services.Export;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = ApplicationRoles.Administrator)]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;

    public ExportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpGet("products/excel")]
    public async Task<IActionResult> ExportProductsExcel()
    {
        var bytes = await _exportService.ExportProductsToExcelAsync();
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Productos_Firmeza.xlsx");
    }

    [HttpGet("products/pdf")]
    public async Task<IActionResult> ExportProductsPdf()
    {
        var bytes = await _exportService.ExportProductsToPdfAsync();
        return File(bytes, "application/pdf", "Reporte_Inventario_Firmeza.pdf");
    }

    [HttpGet("customers/excel")]
    public async Task<IActionResult> ExportCustomersExcel()
    {
        var bytes = await _exportService.ExportCustomersToExcelAsync();
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Clientes_Firmeza.xlsx");
    }

    [HttpGet("sales/excel")]
    public async Task<IActionResult> ExportSalesExcel()
    {
        var bytes = await _exportService.ExportSalesToExcelAsync();
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Ventas_Firmeza.xlsx");
    }

    [HttpGet("sales/pdf")]
    public async Task<IActionResult> ExportSalesPdf()
    {
        var bytes = await _exportService.ExportSalesToPdfAsync();
        return File(bytes, "application/pdf", "Reporte_Ventas_Firmeza.pdf");
    }
}
