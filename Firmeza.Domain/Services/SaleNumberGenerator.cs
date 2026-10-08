using System;

namespace Firmeza.Domain.Services
{
    public static class SaleNumberGenerator
    {
        public static string Generate(int sequence, DateTime? date = null)
        {
            var d = date ?? DateTime.UtcNow;
            return $"VTA-{d:yyyyMMdd}-{sequence:D4}";
        }
    }
}
