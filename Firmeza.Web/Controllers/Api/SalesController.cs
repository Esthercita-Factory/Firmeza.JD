using Firmeza.Application.Dtos.Sales;
using Firmeza.Application.Services.Sales;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly ISaleService _service;
    public SalesController(ISaleService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var s = await _service.GetByIdAsync(id);
        return s == null ? NotFound() : Ok(s);
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] SaleCreateDto dto) => Ok(await _service.CreateAsync(dto));
}
