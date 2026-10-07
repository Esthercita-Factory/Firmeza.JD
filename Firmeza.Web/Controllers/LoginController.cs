using Microsoft.AspNetCore.Mvc;

namespace Firmeza.Web.Controllers;

public class LoginController : Controller
{
    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }

    [HttpPost]
    public IActionResult Index(string? correo, string? clave)
    {
        var faltaCorreo = string.IsNullOrWhiteSpace(correo);
        var faltaClave = string.IsNullOrWhiteSpace(clave);

        if (faltaCorreo || faltaClave)
        {
            ViewBag.Error = faltaCorreo && faltaClave
                ? "Escribe tu correo y tu contraseña para continuar."
                : faltaCorreo
                    ? "El correo es obligatorio."
                    : "La contraseña es obligatoria.";
            ViewBag.CampoError = faltaCorreo && faltaClave
                ? "ambos"
                : faltaCorreo
                    ? "correo"
                    : "clave";

            return View();
        }

        // Aquí se validará la credencial cuando se integre autenticación.
        return RedirectToAction(nameof(Index));
    }
}
