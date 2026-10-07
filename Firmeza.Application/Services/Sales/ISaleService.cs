using Firmeza.Application.Dtos.Sales;

namespace Firmeza.Application.Services.Sales;

public interface ISaleService
{
    Task<IEnumerable<SaleDto>> GetAllAsync();
    Task<SaleDto?> GetByIdAsync(int id);
    Task<SaleDto> CreateAsync(SaleCreateDto dto);
}
