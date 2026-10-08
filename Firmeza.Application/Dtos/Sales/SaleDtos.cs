using System;
using System.Collections.Generic;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Services;

namespace Firmeza.Application.Dtos.Sales;

public static class SaleServiceLimits
{
    public const int MaxPendingPerCustomer = 5;
}

public class SaleDto
{
    public int Id { get; set; }
    public string SaleNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Status { get; set; } = nameof(SaleStatus.Pending);
    public string StatusLabel { get; set; } = "Pendiente";
    public decimal SubtotalNeto { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TaxRate { get; set; } = InventoryCalculator.TaxRate;
    public decimal TotalAmount { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public IEnumerable<SaleDetailDto> Details { get; set; } = new List<SaleDetailDto>();
}

public class SaleDetailDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal => Quantity * UnitPrice;
}

public class SaleCreateDto
{
    public int? CustomerId { get; set; }
    public IEnumerable<SaleDetailCreateDto> Details { get; set; } = new List<SaleDetailCreateDto>();
}

public class SaleDetailCreateDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateSaleStatusDto
{
    public SaleStatus Status { get; set; }
}
