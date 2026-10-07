namespace Firmeza.Web.ViewModels
{
    public class DashboardViewModel
    {
        public int ProductCount { get; set; }
        public string ProductVariation { get; set; } = string.Empty; // e.g. "+5% este mes"
        public bool ProductIsPositive { get; set; }

        public int CustomerCount { get; set; }
        public string CustomerVariation { get; set; } = string.Empty;
        public bool CustomerIsPositive { get; set; }

        public int SalesCount { get; set; }
        public string SalesVariation { get; set; } = string.Empty;
        public bool SalesIsPositive { get; set; }

        public decimal TotalSalesAmount { get; set; }
        public string AmountVariation { get; set; } = string.Empty;
        public bool AmountIsPositive { get; set; }

        // Chart Data (Last 7 days or so)
        public List<string> ChartLabels { get; set; } = new List<string>();
        public List<decimal> ChartData { get; set; } = new List<decimal>();

        // Recent Sales Table
        public List<RecentSaleViewModel> RecentSales { get; set; } = new List<RecentSaleViewModel>();
    }

    public class RecentSaleViewModel
    {
        public int SaleId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Completado"; // Fake status for UI
    }
}
