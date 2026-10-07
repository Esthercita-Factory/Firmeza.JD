namespace Firmeza.Application.Dtos.Dashboard;

public class DashboardSummaryDto
{
    public decimal TodaySales { get; set; }
    public int NewCustomers { get; set; }
    public int LowStockProductsCount { get; set; }
    public IEnumerable<decimal> WeeklySales { get; set; } = new List<decimal>();
    public IEnumerable<TopProductDto> TopProducts { get; set; } = new List<TopProductDto>();
}

public class TopProductDto
{
    public string Name { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
}
