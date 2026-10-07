using System.ComponentModel.DataAnnotations;

namespace Firmeza.Web.ViewModels
{
    public class CustomerViewModel
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
        
        [Required(ErrorMessage = "La edad es obligatoria")]
        public string Age { get; set; } = string.Empty; // String to test int.Parse exception handling
    }
}
