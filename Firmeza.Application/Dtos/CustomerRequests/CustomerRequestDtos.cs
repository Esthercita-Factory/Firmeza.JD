using System;
using Firmeza.Domain.Enums;

namespace Firmeza.Application.Dtos.CustomerRequests;

public class CustomerRequestResponse
{
    public int Id { get; set; }
    public string CompanyOrFullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? TaxId { get; set; }
    public CustomerRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByUserId { get; set; }
}

public class CustomerRequestReviewResponse
{
    public int Id { get; set; }
    public CustomerRequestStatus Status { get; set; }
    public int? CustomerId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class CustomerSignupDto
{
    public string CompanyOrFullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? TaxId { get; set; }
}
