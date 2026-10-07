using Firmeza.Application.Dtos.Customers;

namespace Firmeza.Application.Services.Customers;

public interface ICustomerService
{
    Task<IEnumerable<CustomerDto>> GetAllAsync(string? search);
    Task<CustomerDto?> GetByIdAsync(int id);
    Task<CustomerDto> CreateAsync(CustomerCreateDto dto);
    Task<bool> UpdateAsync(int id, CustomerCreateDto dto);
    Task<bool> DeleteAsync(int id);
}
