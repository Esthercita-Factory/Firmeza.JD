using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Firmeza.Web.Data.Entities;

public class Product
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? SKU { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public int Stock { get; set; }

    [MaxLength(20)]
    public string UnitOfMeasure { get; set; } = "Unidad"; // Ej: Kg, Tonelada, Bulto, Metro

    public bool IsActive { get; set; } = true;

    // Navigation property
    public ICollection<SaleDetail> SaleDetails { get; set; } = new List<SaleDetail>();
}
