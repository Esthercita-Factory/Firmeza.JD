using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Firmeza.Web.Data.Entities;

public class Sale
{
    public int Id { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow;

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // Ej: Pending, Completed, Cancelled

    // Navigation property: Una venta tiene muchos detalles
    public ICollection<SaleDetail> SaleDetails { get; set; } = new List<SaleDetail>();
}
