const AVERAGE_SPEED_KPH = 50; // Average speed of delivery in km/h
const BASE_PREP_TIME = 15; // Base preparation time in minutes

export async function calculateDeliveryTime(originAddress, destinationAddress) {
  try {
    const response = await fetch(`/api/calculateDistance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        origin: originAddress,
        destination: destinationAddress,
      }),
    });

    const data = await response.json();

    if (data.durationMinutes) {
      // Add base preparation time to the travel time
      const totalTime = Math.ceil(data.durationMinutes + BASE_PREP_TIME);
      return totalTime;
    }

    return BASE_PREP_TIME; // Return default time if calculation fails
  } catch (error) {
    console.error("Error calculating delivery time:", error);
    return BASE_PREP_TIME; // Return default time if API fails
  }
}
