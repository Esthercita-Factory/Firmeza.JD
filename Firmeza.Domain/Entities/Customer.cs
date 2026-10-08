using System.ComponentModel.DataAnnotations;

namespace Firmeza.Domain.Entities
{
    public class Customer
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "El nombre es obligatorio")]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "El documento es obligatorio")]
        [StringLength(20)]
        public string Document { get; set; } = string.Empty;
        
        [EmailAddress(ErrorMessage = "Formato de correo inválido")]
        public string? Email { get; set; }
        
        [Phone(ErrorMessage = "Formato de teléfono inválido")]
        public string? Phone { get; set; }
        
        [Range(18, 120, ErrorMessage = "La edad debe estar entre 18 y 120")]
        public int Age { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public string? Address { get; set; }

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public System.DateTime CreatedAt { get; set; } = System.DateTime.UtcNow;
    }
}
