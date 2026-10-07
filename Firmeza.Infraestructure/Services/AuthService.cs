using Firmeza.Application.Dtos.Auth;
using Firmeza.Application.Services.Auth;
using Firmeza.Infraestructure.Security;
using Microsoft.AspNetCore.Identity;

namespace Firmeza.Infraestructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly JwtTokenService _jwtService;

    public AuthService(UserManager<IdentityUser> userManager, JwtTokenService jwtService)
    {
        _userManager = userManager;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null) return null;

        var isValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValid) return null;

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Cliente";

        var token = _jwtService.GenerateToken(user.Email!, role);

        return new AuthResponse
        {
            Token = token,
            Email = user.Email!,
            Role = role
        };
    }

    public async Task<bool> RegisterAsync(RegisterRequest request)
    {
        var user = new IdentityUser { UserName = request.Email, Email = request.Email };
        var result = await _userManager.CreateAsync(user, request.Password);

        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(user, "Cliente");
            return true;
        }

        return false;
    }
}
