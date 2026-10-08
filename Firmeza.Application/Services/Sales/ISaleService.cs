using System.Collections.Generic;
using System.Threading.Tasks;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Services.Sales;

public interface ISaleService
{
    Task<IEnumerable<SaleDto>> GetAllAsync();
    Task<IEnumerable<SaleDto>> GetByCustomerEmailAsync(string email);
    Task<SaleDto?> GetByIdAsync(int id);
    Task<SaleDto> CreateAsync(SaleCreateDto dto, string? userEmail = null, bool isStaff = false);
    Task<SaleDto?> ChangeStatusAsync(int id, SaleStatus newStatus, string? userId = null);
    Task<SaleDto?> CancelAsync(int id, string? userEmail = null, bool isStaff = false);
    Task<bool> DeleteAsync(int id);
}
