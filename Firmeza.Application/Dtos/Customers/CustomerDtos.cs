namespace Firmeza.Application.Dtos.Customers;

public class CustomerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int Age { get; set; }
}

public class CustomerCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int Age { get; set; }
}
