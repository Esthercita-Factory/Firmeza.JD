using Firmeza.Application.Dtos.Customers;
using Firmeza.Application.Services.Customers;
using Firmeza.Domain.Entities;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infraestructure.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _context;
    public CustomerService(ApplicationDbContext context) => _context = context;

    public async Task<IEnumerable<CustomerDto>> GetAllAsync(string? search)
    {
        var query = _context.Customers.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.Contains(search) || c.Document.Contains(search));

        return await query.Select(c => new CustomerDto
        {
            Id = c.Id, Name = c.Name, Document = c.Document,
            Email = c.Email, Phone = c.Phone, Age = c.Age
        }).ToListAsync();
    }

    public async Task<CustomerDto?> GetByIdAsync(int id)
    {
        var c = await _context.Customers.FindAsync(id);
        if (c == null) return null;
        return new CustomerDto { Id = c.Id, Name = c.Name, Document = c.Document, Email = c.Email, Phone = c.Phone, Age = c.Age };
    }

    public async Task<CustomerDto> CreateAsync(CustomerCreateDto dto)
    {
        var c = new Customer { Name = dto.Name, Document = dto.Document, Email = dto.Email, Phone = dto.Phone, Age = dto.Age };
        _context.Customers.Add(c);
        await _context.SaveChangesAsync();
        return new CustomerDto { Id = c.Id, Name = c.Name, Document = c.Document, Email = c.Email, Phone = c.Phone, Age = c.Age };
    }

    public async Task<bool> UpdateAsync(int id, CustomerCreateDto dto)
    {
        var c = await _context.Customers.FindAsync(id);
        if (c == null) return false;
        c.Name = dto.Name; c.Document = dto.Document; c.Email = dto.Email; c.Phone = dto.Phone; c.Age = dto.Age;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var c = await _context.Customers.FindAsync(id);
        if (c == null) return false;
        _context.Customers.Remove(c);
        await _context.SaveChangesAsync();
        return true;
    }
}
