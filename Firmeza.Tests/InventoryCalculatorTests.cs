using System;
using Firmeza.Domain.Enums;
using Firmeza.Domain.Services;
using Xunit;

namespace Firmeza.Tests;

public class InventoryCalculatorTests
{
    [Fact]
    public void SplitTaxInclusive_Should_Calculate_19Percent_Vat_Correctly()
    {
        // Total con IVA incluido: $119,000 COP
        decimal totalAmount = 119000m;

        var breakdown = InventoryCalculator.SplitTaxInclusive(totalAmount);

        // Subtotal base esperado: $100,000
        // IVA (19%) esperado: $19,000
        Assert.Equal(100000m, breakdown.SubtotalBase);
        Assert.Equal(19000m, breakdown.Tax);
        Assert.Equal(totalAmount, breakdown.SubtotalBase + breakdown.Tax);
    }

    [Fact]
    public void SplitTaxInclusive_With_Zero_Amount_Should_Return_Zero()
    {
        var breakdown = InventoryCalculator.SplitTaxInclusive(0m);

        Assert.Equal(0m, breakdown.SubtotalBase);
        Assert.Equal(0m, breakdown.Tax);
    }

    [Theory]
    [InlineData(SaleStatus.Pending, SaleStatus.Confirmed, true)]
    [InlineData(SaleStatus.Pending, SaleStatus.Cancelled, true)]
    [InlineData(SaleStatus.Confirmed, SaleStatus.Delivered, true)]
    [InlineData(SaleStatus.Delivered, SaleStatus.Pending, false)]
    [InlineData(SaleStatus.Cancelled, SaleStatus.Delivered, false)]
    public void SaleStatusRules_Transitions_Should_Enforce_Business_Constraints(
        SaleStatus current, 
        SaleStatus target, 
        bool expectedAllowed)
    {
        bool allowed = SaleStatusRules.CanTransitionTo(current, target);
        Assert.Equal(expectedAllowed, allowed);
    }
}
