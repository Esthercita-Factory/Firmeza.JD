using System.IO;
using System.Threading.Tasks;
using Firmeza.Application.Services.Import;
using Firmeza.Domain.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = ApplicationRoles.Administrator)]
public class ImportController : ControllerBase
{
    private readonly IExcelImportService _importService;

    public ImportController(IExcelImportService importService)
    {
        _importService = importService;
    }

    [HttpPost("excel")]
    public async Task<IActionResult> ImportExcel([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No se ha seleccionado ningún archivo para cargar." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".xlsx" && ext != ".xls")
        {
            return BadRequest(new { message = "Formato no válido. Debe ser un archivo de Excel (.xlsx)." });
        }

        using var stream = file.OpenReadStream();
        var result = await _importService.ImportFromStreamAsync(stream);

        return Ok(result);
    }

    [HttpGet("template")]
    [AllowAnonymous]
    public IActionResult DownloadTemplate()
    {
        var templateBytes = _importService.GenerateSampleTemplate();
        return File(
            templateBytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Plantilla_Carga_Masiva_Firmeza.xlsx");
    }
}
