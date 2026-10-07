using Firmeza.Application.Dtos.Auth;
using Firmeza.Application.Services.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        if (response == null) return Unauthorized(new { message = "Credenciales inválidas" });
        return Ok(response);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        if (!result) return BadRequest(new { message = "No se pudo crear el usuario" });
        return Ok(new { message = "Usuario registrado" });
    }
}
