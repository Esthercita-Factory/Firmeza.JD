using Firmeza.Application.Dtos.Customers;
using Firmeza.Application.Services.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _service;
    public CustomersController(ICustomerService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search) => Ok(await _service.GetAllAsync(search));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var c = await _service.GetByIdAsync(id);
        return c == null ? NotFound() : Ok(c);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] CustomerCreateDto dto) => Ok(await _service.CreateAsync(dto));

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] CustomerCreateDto dto)
    {
        var success = await _service.UpdateAsync(id, dto);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        return success ? NoContent() : NotFound();
    }
}
