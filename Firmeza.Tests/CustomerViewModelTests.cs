using Firmeza.Web.ViewModels;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace Firmeza.Tests
{
    public class CustomerViewModelTests
    {
        [Fact]
        public void CustomerViewModel_Should_Be_Valid_With_Correct_Data()
        {
            // Arrange
            var model = new CustomerViewModel
            {
                Name = "Juan Perez",
                Document = "12345678",
                Email = "juan@example.com",
                Phone = "1234567890",
                Age = "25"
            };

            var validationContext = new ValidationContext(model);
            var validationResults = new List<ValidationResult>();

            // Act
            bool isValid = Validator.TryValidateObject(model, validationContext, validationResults, true);

            // Assert
            Assert.True(isValid);
            Assert.Empty(validationResults);
        }

        [Fact]
        public void CustomerViewModel_Should_Be_Invalid_Without_Name()
        {
            // Arrange
            var model = new CustomerViewModel
            {
                // Name = missing
                Document = "12345678",
                Email = "juan@example.com",
                Age = "25"
            };

            var validationContext = new ValidationContext(model);
            var validationResults = new List<ValidationResult>();

            // Act
            bool isValid = Validator.TryValidateObject(model, validationContext, validationResults, true);

            // Assert
            Assert.False(isValid);
            Assert.Contains(validationResults, v => v.MemberNames.Contains("Name"));
        }
    }
}
