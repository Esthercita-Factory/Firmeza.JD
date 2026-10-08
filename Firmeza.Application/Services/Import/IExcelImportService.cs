using System.IO;
using System.Threading.Tasks;
using Firmeza.Application.Dtos.Import;

namespace Firmeza.Application.Services.Import;

public interface IExcelImportService
{
    Task<ExcelImportResultDto> ImportFromStreamAsync(Stream stream);
    byte[] GenerateSampleTemplate();
}
