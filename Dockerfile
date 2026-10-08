FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["Firmeza.Domain/Firmeza.Domain.csproj", "Firmeza.Domain/"]
COPY ["Firmeza.Application/Firmeza.Application.csproj", "Firmeza.Application/"]
COPY ["Firmeza.Infraestructure/Firmeza.Infraestructure.csproj", "Firmeza.Infraestructure/"]
COPY ["Firmeza.Web/Firmeza.Web.csproj", "Firmeza.Web/"]
RUN dotnet restore "Firmeza.Web/Firmeza.Web.csproj"

COPY . .
WORKDIR "/src/Firmeza.Web"
RUN dotnet build "Firmeza.Web.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Firmeza.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
RUN mkdir -p /app/wwwroot/recibos
ENTRYPOINT ["dotnet", "Firmeza.Web.dll"]
