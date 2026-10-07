using Firmeza.Application.Dtos.Sales;
using Firmeza.Application.Services.Sales;
using Firmeza.Domain.Entities;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infraestructure.Services;

public class SaleService : ISaleService
{
    private readonly ApplicationDbContext _context;
    public SaleService(ApplicationDbContext context) => _context = context;

    public async Task<IEnumerable<SaleDto>> GetAllAsync()
    {
        return await _context.Sales.Include(s => s.Customer).Select(s => new SaleDto
        {
            Id = s.Id, Date = s.Date, CustomerId = s.CustomerId, CustomerName = s.Customer.Name, TotalAmount = s.TotalAmount
        }).ToListAsync();
    }

    public async Task<SaleDto?> GetByIdAsync(int id)
    {
        var s = await _context.Sales.Include(x => x.Customer).Include(x => x.Details).ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return null;

        return new SaleDto
        {
            Id = s.Id, Date = s.Date, CustomerId = s.CustomerId, CustomerName = s.Customer.Name, TotalAmount = s.TotalAmount,
            Details = s.Details.Select(d => new SaleDetailDto { Id = d.Id, ProductId = d.ProductId, ProductName = d.Product.Name, Quantity = d.Quantity, UnitPrice = d.UnitPrice })
        };
    }

    public async Task<SaleDto> CreateAsync(SaleCreateDto dto)
    {
        var sale = new Sale { CustomerId = dto.CustomerId, Date = DateTime.UtcNow, Details = new List<SaleDetail>() };
        decimal total = 0;

        foreach (var d in dto.Details)
        {
            var p = await _context.Products.FindAsync(d.ProductId);
            if (p != null && p.Stock >= d.Quantity)
            {
                p.Stock -= d.Quantity;
                sale.Details.Add(new SaleDetail { ProductId = p.Id, Quantity = d.Quantity, UnitPrice = p.Price });
                total += p.Price * d.Quantity;
            }
        }
        sale.TotalAmount = total;
        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(sale.Id) ?? throw new Exception("Error returning sale");
    }
}
