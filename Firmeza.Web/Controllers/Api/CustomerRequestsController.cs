using System;
using System.Linq;
using System.Threading.Tasks;
using Firmeza.Application.Dtos.CustomerRequests;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Identity;
using Firmeza.Infraestructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Web.Controllers.Api;

[ApiController]
[Route("api/customer-requests")]
public class CustomerRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public CustomerRequestsController(ApplicationDbContext context, UserManager<IdentityUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpPost("signup")]
    [AllowAnonymous]
    public async Task<IActionResult> Signup(
        [FromBody] CustomerSignupDto dto,
        [FromServices] Firmeza.Application.Services.Email.IEmailService emailService)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest(new { message = "Email y contraseña son obligatorios." });
        }

        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return Conflict(new { message = "Ya existe un usuario registrado con este correo." });
        }

        var user = new IdentityUser { UserName = dto.Email, Email = dto.Email };
        var createResult = await _userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
        {
            return BadRequest(new { message = string.Join("; ", createResult.Errors.Select(e => e.Description)) });
        }

        await _userManager.AddToRoleAsync(user, ApplicationRoles.Customer);

        // Crear inmediatamente la entidad Customer para que pueda comprar
        var customer = new Customer
        {
            Name = dto.CompanyOrFullName,
            Email = dto.Email,
            Phone = dto.PhoneNumber ?? "",
            Document = dto.TaxId ?? "12345678",
            Address = dto.Address
        };
        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        // TASK 7: Enviar correo de bienvenida al cliente
        _ = Task.Run(async () =>
        {
            try
            {
                await emailService.SendWelcomeRegistrationAsync(dto.Email, dto.CompanyOrFullName);
            }
            catch { }
        });

        return Ok(new { message = "Cuenta de cliente creada exitosamente. Ya puedes iniciar sesión." });
    }

    [HttpGet]
    [Authorize(Roles = ApplicationRoles.Administrator)]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.Customers.OrderByDescending(c => c.Id).Select(c => new CustomerRequestResponse
        {
            Id = c.Id,
            CompanyOrFullName = c.Name,
            Email = c.Email ?? "",
            PhoneNumber = c.Phone,
            TaxId = c.Document,
            Status = CustomerRequestStatus.Approved,
            CreatedAt = DateTime.UtcNow
        }).ToListAsync();

        return Ok(list);
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = ApplicationRoles.Administrator)]
    public async Task<IActionResult> Reject(int id, [FromBody] string? reason)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null) return NotFound();

        return Ok(new CustomerRequestReviewResponse
        {
            Id = customer.Id,
            Status = CustomerRequestStatus.Rejected,
            Message = "Cliente descartado."
        });
    }
}
