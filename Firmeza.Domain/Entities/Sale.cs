using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Firmeza.Domain.Entities
{
    public class Sale
    {
        public int Id { get; set; }
        
        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;
        
        [Required]
        public int CustomerId { get; set; }
        
        [ForeignKey("CustomerId")]
        public Customer Customer { get; set; } = null!;
        
        public decimal TotalAmount { get; set; }
        
        public ICollection<SaleDetail> Details { get; set; } = new List<SaleDetail>();
    }
}
