using AutoMapper;
using Firmeza.Application.Dtos.Customers;
using Firmeza.Application.Services.Customers;
using Firmeza.Domain.Entities;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infraestructure.Services;

public class CustomerService : ICustomerService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    
    public CustomerService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CustomerDto>> GetAllAsync(string? search)
    {
        var query = _context.Customers.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.Contains(search) || c.Document.Contains(search));

        var customers = await query.ToListAsync();
        return _mapper.Map<IEnumerable<CustomerDto>>(customers);
    }

    public async Task<CustomerDto?> GetByIdAsync(int id)
    {
        var c = await _context.Customers.FindAsync(id);
        if (c == null) return null;
        return _mapper.Map<CustomerDto>(c);
    }

    public async Task<CustomerDto> CreateAsync(CustomerCreateDto dto)
    {
        var c = _mapper.Map<Customer>(dto);
        _context.Customers.Add(c);
        await _context.SaveChangesAsync();
        return _mapper.Map<CustomerDto>(c);
    }

    public async Task<bool> UpdateAsync(int id, CustomerCreateDto dto)
    {
        var c = await _context.Customers.FindAsync(id);
        if (c == null) return false;
        _mapper.Map(dto, c);
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
