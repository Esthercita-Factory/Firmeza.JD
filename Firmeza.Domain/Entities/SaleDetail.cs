using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Firmeza.Domain.Entities
{
    public class SaleDetail
    {
        public int Id { get; set; }
        
        [Required]
        public int SaleId { get; set; }
        
        [ForeignKey("SaleId")]
        public Sale Sale { get; set; } = null!;
        
        [Required]
        public int ProductId { get; set; }
        
        [ForeignKey("ProductId")]
        public Product Product { get; set; } = null!;
        
        [Required]
        public int Quantity { get; set; }
        
        [Required]
        public decimal UnitPrice { get; set; }
    }
}
