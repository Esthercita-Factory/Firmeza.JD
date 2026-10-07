using Firmeza.Application.Dtos.Dashboard;
using Firmeza.Application.Services.Dashboard;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infraestructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    public DashboardService(ApplicationDbContext context) => _context = context;

    public async Task<DashboardSummaryDto> GetSummaryAsync()
    {
        var today = DateTime.UtcNow.Date;
        var todaySales = await _context.Sales.Where(s => s.Date >= today).SumAsync(s => s.TotalAmount);
        
        // This is a naive implementation for the sake of the exercise
        var newCustomers = await _context.Customers.CountAsync(); 
        var lowStock = await _context.Products.CountAsync(p => p.Stock < 10);

        var topProducts = await _context.SaleDetails
            .GroupBy(sd => sd.Product.Name)
            .Select(g => new TopProductDto { Name = g.Key, QuantitySold = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.QuantitySold)
            .Take(5)
            .ToListAsync();

        return new DashboardSummaryDto
        {
            TodaySales = todaySales,
            NewCustomers = newCustomers,
            LowStockProductsCount = lowStock,
            WeeklySales = new List<decimal> { 100, 200, 150, 300, 250, 400, todaySales },
            TopProducts = topProducts
        };
    }
}
