using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Firmeza.Domain.Enums;

namespace Firmeza.Domain.Entities
{
    public class Sale
    {
        public int Id { get; set; }
        
        private string _saleNumber = string.Empty;

        [NotMapped]
        public string SaleNumber 
        { 
            get => string.IsNullOrEmpty(_saleNumber) ? $"VTA-{Date:yyyyMMdd}-{Id:D4}" : _saleNumber; 
            set => _saleNumber = value; 
        }

        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;
        
        [Required]
        public int CustomerId { get; set; }
        
        [ForeignKey("CustomerId")]
        public Customer Customer { get; set; } = null!;
        
        [NotMapped]
        public SaleStatus Status { get; set; } = SaleStatus.Pending;

        /// <summary>Indica si ya se descontó el stock para no devolver existencias no descontadas.</summary>
        [NotMapped]
        public bool HasStockDeducted { get; set; }

        public decimal TotalAmount { get; set; }

        [NotMapped]
        public string? CreatedByUserId { get; set; }

        [NotMapped]
        public string? ConfirmedByUserId { get; set; }

        [NotMapped]
        public DateTime? ConfirmedAt { get; set; }

        [NotMapped]
        public DateTime? DeliveredAt { get; set; }

        [NotMapped]
        public DateTime? CancelledAt { get; set; }
        
        public ICollection<SaleDetail> Details { get; set; } = new List<SaleDetail>();
    }
}
