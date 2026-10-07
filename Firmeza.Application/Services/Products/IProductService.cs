using Firmeza.Application.Dtos.Products;

namespace Firmeza.Application.Services.Products;

public interface IProductService
{
    Task<IEnumerable<ProductDto>> GetAllAsync(string? search);
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(ProductCreateDto dto);
    Task<bool> UpdateAsync(int id, ProductCreateDto dto);
    Task<bool> DeleteAsync(int id);
}
