using Firmeza.Application.Dtos.Products;
using Firmeza.Application.Services.Products;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _service;
    public ProductsController(IProductService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search) => Ok(await _service.GetAllAsync(search));

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var p = await _service.GetByIdAsync(id);
        return p == null ? NotFound() : Ok(p);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Post([FromBody] ProductCreateDto dto) => Ok(await _service.CreateAsync(dto));

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Put(int id, [FromBody] ProductCreateDto dto)
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
