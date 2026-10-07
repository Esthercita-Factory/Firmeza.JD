using Firmeza.Application.Dtos.Dashboard;

namespace Firmeza.Application.Services.Dashboard;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync();
}
