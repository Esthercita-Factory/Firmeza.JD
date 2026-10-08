using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Firmeza.Domain.Entities
{
    public class Product
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a cero.")]
        public decimal Price { get; set; }
        
        [Required]
        public int Stock { get; set; }

        [NotMapped]
        public int MinStock { get; set; } = 10;

        [NotMapped]
        public string Unit { get; set; } = "Unidad";

        [NotMapped]
        public string Sku { get; set; } = string.Empty;
    }
}
