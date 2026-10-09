using AutoMapper;
using Firmeza.Domain.Entities;
using Firmeza.Application.Dtos.Products;
using Firmeza.Application.Dtos.Customers;
using Firmeza.Application.Dtos.Sales;
using Firmeza.Domain.Services;

namespace Firmeza.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Product, ProductDto>();
        CreateMap<ProductCreateDto, Product>();

        CreateMap<Customer, CustomerDto>();
        CreateMap<CustomerCreateDto, Customer>();

        CreateMap<Sale, SaleDto>()
            .ForMember(dest => dest.SaleNumber, opt => opt.MapFrom(src => string.IsNullOrEmpty(src.SaleNumber) ? $"VTA-{src.Date:yyyyMMdd}-{src.Id:D4}" : src.SaleNumber))
            .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Customer != null ? src.Customer.Name : "Cliente General"))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.StatusLabel, opt => opt.MapFrom(src => Firmeza.Domain.Services.SaleStatusRules.Label(src.Status)))
            .ForMember(dest => dest.SubtotalNeto, opt => opt.MapFrom(src => InventoryCalculator.SplitTaxInclusive(src.TotalAmount).SubtotalBase))
            .ForMember(dest => dest.TaxAmount, opt => opt.MapFrom(src => InventoryCalculator.SplitTaxInclusive(src.TotalAmount).Tax))
            .ForMember(dest => dest.TaxRate, opt => opt.MapFrom(src => InventoryCalculator.TaxRate));

        CreateMap<SaleDetail, SaleDetailDto>()
            .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : $"Producto #{src.ProductId}"));
    }
}
