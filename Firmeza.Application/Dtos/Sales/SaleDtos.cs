namespace Firmeza.Application.Dtos.Sales;

public class SaleDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public IEnumerable<SaleDetailDto> Details { get; set; } = new List<SaleDetailDto>();
}

public class SaleDetailDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class SaleCreateDto
{
    public int CustomerId { get; set; }
    public IEnumerable<SaleDetailCreateDto> Details { get; set; } = new List<SaleDetailCreateDto>();
}

public class SaleDetailCreateDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}
