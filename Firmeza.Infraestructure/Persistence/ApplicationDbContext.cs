using Firmeza.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Firmeza.Infraestructure.Persistence
{
    public class ApplicationDbContext : IdentityDbContext<IdentityUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<SaleDetail> SaleDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            // Configurar precisión de decimales para PostgreSQL si es necesario
            builder.Entity<Product>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");
                
            builder.Entity<Sale>()
                .Property(s => s.TotalAmount)
                .HasColumnType("decimal(18,2)");
                
            builder.Entity<SaleDetail>()
                .Property(sd => sd.UnitPrice)
                .HasColumnType("decimal(18,2)");
        }
    }
}
