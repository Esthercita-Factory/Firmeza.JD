using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Firmeza.Infraestructure.Persistence;
using Firmeza.Domain.Entities;
using Firmeza.Web.Models;
using Firmeza.Web.ViewModels;

namespace Firmeza.Web.Controllers
{
    [Authorize(Roles = "Administrador")]
    public class CustomersController : Controller
    {
        private readonly ApplicationDbContext _context;

        public CustomersController(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(string searchString)
        {
            var customers = from c in _context.Customers select c;

            if (!string.IsNullOrEmpty(searchString))
            {
                customers = customers.Where(s => s.Name.Contains(searchString) || s.Document.Contains(searchString));
            }

            ViewData["CurrentFilter"] = searchString;

            return View(await customers.ToListAsync());
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CustomerViewModel model)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    // Tarea 7: Implementar manejo básico de errores con try-catch
                    int parsedAge = int.Parse(model.Age);

                    if (parsedAge < 18 || parsedAge > 120)
                    {
                        ModelState.AddModelError("Age", "La edad debe estar entre 18 y 120 años.");
                        return View(model);
                    }

                    var customer = new Customer
                    {
                        Name = model.Name,
                        Document = model.Document,
                        Email = model.Email,
                        Phone = model.Phone,
                        Age = parsedAge
                    };
                    
                    _context.Add(customer);
                    await _context.SaveChangesAsync();
                    return RedirectToAction(nameof(Index));
                }
                catch (FormatException)
                {
                    ModelState.AddModelError("Age", "Por favor, ingrese un número entero válido para la edad.");
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError(string.Empty, $"Ocurrió un error inesperado: {ex.Message}");
                }
            }
            return View(model);
        }

        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();

            var model = new CustomerViewModel
            {
                Id = customer.Id,
                Name = customer.Name,
                Document = customer.Document,
                Email = customer.Email,
                Phone = customer.Phone,
                Age = customer.Age.ToString()
            };
            return View(model);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, CustomerViewModel model)
        {
            if (id != model.Id) return NotFound();

            if (ModelState.IsValid)
            {
                try
                {
                    int parsedAge = int.Parse(model.Age);

                    if (parsedAge < 18 || parsedAge > 120)
                    {
                        ModelState.AddModelError("Age", "La edad debe estar entre 18 y 120 años.");
                        return View(model);
                    }

                    var customer = await _context.Customers.FindAsync(id);
                    if (customer == null) return NotFound();

                    customer.Name = model.Name;
                    customer.Document = model.Document;
                    customer.Email = model.Email;
                    customer.Phone = model.Phone;
                    customer.Age = parsedAge;

                    _context.Update(customer);
                    await _context.SaveChangesAsync();
                    return RedirectToAction(nameof(Index));
                }
                catch (FormatException)
                {
                    ModelState.AddModelError("Age", "Por favor, ingrese un número entero válido para la edad.");
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CustomerExists(model.Id)) return NotFound();
                    else throw;
                }
            }
            return View(model);
        }

        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();

            var customer = await _context.Customers.FirstOrDefaultAsync(m => m.Id == id);
            if (customer == null) return NotFound();

            return View(customer);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer != null)
            {
                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        private bool CustomerExists(int id)
        {
            return _context.Customers.Any(e => e.Id == id);
        }
    }
}
