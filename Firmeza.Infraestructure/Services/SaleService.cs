using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Application.Services.Sales;
using Firmeza.Domain.Entities;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Services;
using Firmeza.Infraestructure.Persistence;
using Microsoft.EntityFrameworkCore;

using AutoMapper;

namespace Firmeza.Infraestructure.Services;

public class SaleService : ISaleService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public SaleService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SaleDto>> GetAllAsync()
    {
        var sales = await _context.Sales
            .Include(s => s.Customer)
            .Include(s => s.Details)
            .ThenInclude(d => d.Product)
            .OrderByDescending(s => s.Date)
            .ToListAsync();

        return _mapper.Map<IEnumerable<SaleDto>>(sales);
    }

    public async Task<IEnumerable<SaleDto>> GetByCustomerEmailAsync(string email)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == email);
        if (customer == null) return Enumerable.Empty<SaleDto>();

        var sales = await _context.Sales
            .Include(s => s.Customer)
            .Include(s => s.Details)
            .ThenInclude(d => d.Product)
            .Where(s => s.CustomerId == customer.Id)
            .OrderByDescending(s => s.Date)
            .ToListAsync();

        return _mapper.Map<IEnumerable<SaleDto>>(sales);
    }

    public async Task<SaleDto?> GetByIdAsync(int id)
    {
        var s = await _context.Sales
            .Include(x => x.Customer)
            .Include(x => x.Details)
            .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        return s == null ? null : _mapper.Map<SaleDto>(s);
    }

    public async Task<SaleDto> CreateAsync(SaleCreateDto dto, string? userEmail = null, bool isStaff = false)
    {
        int customerId;

        if (dto.CustomerId.HasValue && dto.CustomerId.Value > 0)
        {
            customerId = dto.CustomerId.Value;
        }
        else if (!string.IsNullOrEmpty(userEmail))
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email == userEmail);
            if (customer == null)
            {
                // Crear ficha básica de cliente para el usuario autenticado
                customer = new Customer
                {
                    Name = userEmail.Split('@')[0],
                    Email = userEmail,
                    Phone = "No registrado",
                    Address = "No registrada",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
            }
            customerId = customer.Id;
        }
        else
        {
            throw new InvalidOperationException("Se requiere especificar un cliente o contar con sesión de usuario.");
        }

        // Si es cliente, verificar tope de 5 solicitudes pendientes
        if (!isStaff)
        {
            var pendingCount = await _context.Sales
                .CountAsync(s => s.CustomerId == customerId && s.Status == SaleStatus.Pending);

            if (pendingCount >= SaleServiceLimits.MaxPendingPerCustomer)
            {
                throw new InvalidOperationException($"Ya tienes {pendingCount} solicitudes pendientes. Espera su confirmación antes de ingresar una nueva.");
            }
        }

        var sale = new Sale
        {
            CustomerId = customerId,
            Date = DateTime.UtcNow,
            Status = isStaff ? SaleStatus.Confirmed : SaleStatus.Pending,
            HasStockDeducted = false,
            Details = new List<SaleDetail>()
        };

        var lineDetails = new List<(int Quantity, decimal UnitPrice)>();

        foreach (var d in dto.Details)
        {
            var product = await _context.Products.FindAsync(d.ProductId)
                ?? throw new InvalidOperationException($"El producto {d.ProductId} no existe.");

            if (d.Quantity <= 0)
            {
                throw new InvalidOperationException($"La cantidad para '{product.Name}' debe ser mayor a 0.");
            }

            if (product.Stock < d.Quantity)
            {
                throw new InvalidOperationException($"Stock insuficiente para '{product.Name}'. Disponible: {product.Stock}, Solicitado: {d.Quantity}");
            }

            var lineTotal = InventoryCalculator.CalculateLineTotal(d.Quantity, product.Price);
            lineDetails.Add((d.Quantity, product.Price));

            sale.Details.Add(new SaleDetail
            {
                ProductId = product.Id,
                Quantity = d.Quantity,
                UnitPrice = product.Price
            });
        }

        sale.TotalAmount = InventoryCalculator.CalculateTotal(lineDetails);

        // Si el staff la crea directamente en confirmed (punto de venta POS), descontar inventario
        if (isStaff && sale.Status == SaleStatus.Confirmed)
        {
            foreach (var detail in sale.Details)
            {
                var prod = await _context.Products.FindAsync(detail.ProductId);
                if (prod != null)
                {
                    prod.Stock -= detail.Quantity;
                }
            }
            sale.HasStockDeducted = true;
            sale.ConfirmedAt = DateTime.UtcNow;
        }

        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();

        sale.SaleNumber = SaleNumberGenerator.Generate(sale.Id, sale.Date);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(sale.Id) ?? throw new Exception("Error al cargar la venta creada");
    }

    public async Task<SaleDto?> ChangeStatusAsync(int id, SaleStatus newStatus, string? userId = null)
    {
        var sale = await _context.Sales
            .Include(s => s.Details)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sale == null) return null;

        if (!SaleStatusRules.CanTransition(sale.Status, newStatus))
        {
            throw new InvalidOperationException(SaleStatusRules.RejectReason(sale.Status, newStatus));
        }

        // Si pasa a Confirmada y no se ha descontado stock
        if (newStatus == SaleStatus.Confirmed && !sale.HasStockDeducted)
        {
            // Validar stock de todas las líneas primero
            foreach (var detail in sale.Details)
            {
                var product = await _context.Products.FindAsync(detail.ProductId)
                    ?? throw new InvalidOperationException($"El producto {detail.ProductId} no fue encontrado.");

                if (product.Stock < detail.Quantity)
                {
                    throw new InvalidOperationException($"Stock insuficiente para '{product.Name}'. Disponible: {product.Stock}, Necesario: {detail.Quantity}");
                }
            }

            // Descontar atómicamente
            foreach (var detail in sale.Details)
            {
                var product = await _context.Products.FindAsync(detail.ProductId);
                if (product != null)
                {
                    product.Stock -= detail.Quantity;
                }
            }

            sale.HasStockDeducted = true;
            sale.ConfirmedAt = DateTime.UtcNow;
            sale.ConfirmedByUserId = userId;
        }
        else if (newStatus == SaleStatus.Cancelled)
        {
            // Si estaba descontado, restaurar
            if (sale.HasStockDeducted)
            {
                foreach (var detail in sale.Details)
                {
                    var product = await _context.Products.FindAsync(detail.ProductId);
                    if (product != null)
                    {
                        product.Stock += detail.Quantity;
                    }
                }
                sale.HasStockDeducted = false;
            }

            sale.CancelledAt = DateTime.UtcNow;
        }
        else if (newStatus == SaleStatus.Delivered)
        {
            sale.DeliveredAt = DateTime.UtcNow;
        }

        sale.Status = newStatus;
        await _context.SaveChangesAsync();

        return await GetByIdAsync(sale.Id);
    }

    public async Task<SaleDto?> CancelAsync(int id, string? userEmail = null, bool isStaff = false)
    {
        var sale = await _context.Sales.Include(s => s.Customer).FirstOrDefaultAsync(s => s.Id == id);
        if (sale == null) return null;

        if (!isStaff)
        {
            if (sale.Customer?.Email != userEmail)
            {
                throw new UnauthorizedAccessException("No puedes cancelar ventas que no pertenecen a tu cuenta.");
            }

            if (sale.Status != SaleStatus.Pending)
            {
                throw new InvalidOperationException("Solo puedes cancelar solicitudes en estado Pendiente.");
            }
        }

        return await ChangeStatusAsync(id, SaleStatus.Cancelled, userEmail);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var sale = await _context.Sales
            .Include(s => s.Details)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sale == null) return false;

        if (sale.Status == SaleStatus.Delivered)
        {
            throw new InvalidOperationException("No se pueden eliminar ventas que ya fueron entregadas.");
        }

        // Si tenía stock descontado, reponerlo antes de eliminar
        if (sale.HasStockDeducted)
        {
            foreach (var detail in sale.Details)
            {
                var prod = await _context.Products.FindAsync(detail.ProductId);
                if (prod != null)
                {
                    prod.Stock += detail.Quantity;
                }
            }
        }

        _context.Sales.Remove(sale);
        await _context.SaveChangesAsync();
        return true;
    }

}
