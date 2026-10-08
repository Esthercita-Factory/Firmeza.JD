using System;
using System.Collections.Generic;
using System.Linq;
using Firmeza.Domain.Enums;

namespace Firmeza.Domain.Services
{
    /// <summary>
    /// Reglas de avance de una venta.
    ///
    /// El cliente solicita (Pending) y el administrador confirma (Confirmed) y entrega (Delivered).
    /// El inventario se descuenta al confirmar y se restaura al cancelar una venta confirmada.
    /// Entregada y cancelada son estados finales.
    /// </summary>
    public static class SaleStatusRules
    {
        public static IReadOnlyCollection<SaleStatus> AllowedTransitionsFrom(SaleStatus current) => current switch
        {
            SaleStatus.Pending => new[] { SaleStatus.Confirmed, SaleStatus.Cancelled },
            SaleStatus.Confirmed => new[] { SaleStatus.Delivered, SaleStatus.Cancelled },
            _ => Array.Empty<SaleStatus>()
        };

        public static bool CanTransition(SaleStatus current, SaleStatus next)
            => AllowedTransitionsFrom(current).Contains(next);

        public static string RejectReason(SaleStatus current, SaleStatus next) => (current, next) switch
        {
            (SaleStatus.Delivered, _) => "Una venta entregada no cambia de estado.",
            (SaleStatus.Cancelled, _) => "Una venta cancelada no cambia de estado.",
            _ when current == next => "La venta ya tiene ese estado.",
            _ => $"No se puede pasar de {Label(current)} a {Label(next)}."
        };

        public static string Label(SaleStatus status) => status switch
        {
            SaleStatus.Pending => "Pendiente",
            SaleStatus.Confirmed => "Confirmada",
            SaleStatus.Delivered => "Entregada",
            SaleStatus.Cancelled => "Cancelada",
            _ => status.ToString()
        };
    }
}
