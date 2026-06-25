namespace backend.DTOs
{
    public class LocationHistoricalDto
    {
        public List<string> Cities { get; set; } = new List<string>();
        public List<string> SubCities { get; set; } = new List<string>();
        public List<string> Kebeles { get; set; } = new List<string>();
    }
}
