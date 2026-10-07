using Firmeza.Application.Dtos.Auth;

namespace Firmeza.Application.Services.Auth;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<bool> RegisterAsync(RegisterRequest request);
}
