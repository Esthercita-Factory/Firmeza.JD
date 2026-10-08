using System;
using System.ComponentModel.DataAnnotations;
using Firmeza.Domain.Enums;

namespace Firmeza.Domain.Entities
{
    public class CustomerSignupRequest
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string CompanyOrFullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? PhoneNumber { get; set; }

        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(50)]
        public string? TaxId { get; set; }

        public CustomerRequestStatus Status { get; set; } = CustomerRequestStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        public string? ReviewedByUserId { get; set; }

        [MaxLength(500)]
        public string? RejectionReason { get; set; }
    }
}
