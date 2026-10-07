using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firmeza.Infraestructure.Persistence;

namespace Firmeza.Web.Controllers
{
    [Authorize(Roles = "Administrador")]
    public class SalesController : Controller
    {
        private readonly ApplicationDbContext _context;

        public SalesController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            var sales = await _context.Sales
                .Include(s => s.Customer)
                .OrderByDescending(s => s.Date)
                .ToListAsync();
            return View(sales);
        }
    }
}
