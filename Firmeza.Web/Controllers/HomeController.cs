using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Firmeza.Web.ViewModels;

namespace Firmeza.Web.Controllers
{
    [Authorize(Roles = "Administrador")]
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;

        public HomeController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var now = DateTime.UtcNow;
            var startOfThisMonth = new DateTime(now.Year, now.Month, 1);
            var startOfLastMonth = startOfThisMonth.AddMonths(-1);

            // Fetch base metrics
            var productCount = await _context.Products.CountAsync();
            var customerCount = await _context.Customers.CountAsync();
            var salesCount = await _context.Sales.CountAsync();
            var totalSales = await _context.Sales.SumAsync(s => s.TotalAmount);

            // Fetch recent sales for table
            var recentSales = await _context.Sales
                .Include(s => s.Customer)
                .OrderByDescending(s => s.Date)
                .Take(5)
                .Select(s => new RecentSaleViewModel
                {
                    SaleId = s.Id,
                    CustomerName = s.Customer.Name,
                    Date = s.Date,
                    Amount = s.TotalAmount,
                    Status = "Completado"
                })
                .ToListAsync();

            // Chart data: Last 7 days
            var chartLabels = new List<string>();
            var chartData = new List<decimal>();
            for (int i = 6; i >= 0; i--)
            {
                var day = now.Date.AddDays(-i);
                chartLabels.Add(day.ToString("dd MMM"));
                
                var daySales = await _context.Sales
                    .Where(s => s.Date.Date == day)
                    .SumAsync(s => s.TotalAmount);
                
                chartData.Add(daySales);
            }

            var model = new DashboardViewModel
            {
                ProductCount = productCount,
                ProductVariation = "+2% este mes", // TODO: Real calculation
                ProductIsPositive = true,

                CustomerCount = customerCount,
                CustomerVariation = "+15% este mes", // TODO: Real calculation
                CustomerIsPositive = true,

                SalesCount = salesCount,
                SalesVariation = "-3% este mes", // TODO: Real calculation
                SalesIsPositive = false,

                TotalSalesAmount = totalSales,
                AmountVariation = "+8% este mes", // TODO: Real calculation
                AmountIsPositive = true,

                ChartLabels = chartLabels,
                ChartData = chartData,
                RecentSales = recentSales
            };

            return View(model);
        }
    }
}
