using AutoMapper;
using Firmeza.Application.Dtos.Products;
using Firmeza.Application.Services.Products;
using Firmeza.Domain.Entities;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infraestructure.Services;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ProductService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ProductDto>> GetAllAsync(string? search)
    {
        var query = _context.Products.AsQueryable();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => p.Name.Contains(search));
        }

        var products = await query.ToListAsync();
        return _mapper.Map<IEnumerable<ProductDto>>(products);
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var p = await _context.Products.FindAsync(id);
        if (p == null) return null;

        return _mapper.Map<ProductDto>(p);
    }

    public async Task<ProductDto> CreateAsync(ProductCreateDto dto)
    {
        var product = _mapper.Map<Product>(dto);
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return _mapper.Map<ProductDto>(product);
    }

    public async Task<bool> UpdateAsync(int id, ProductCreateDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return false;

        _mapper.Map(dto, product);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return false;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }
}
