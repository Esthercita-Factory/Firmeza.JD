using System.ComponentModel.DataAnnotations;

namespace Firmeza.Web.Data.Entities;

public class Customer
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    // Navigation property: Un cliente tiene muchas ventas
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
