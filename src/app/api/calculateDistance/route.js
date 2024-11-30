import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { origin, destination } = await req.json();

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${
      process.env.GOOGLE_MAPS_API_KEY
    }`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.rows[0]?.elements[0]?.duration?.value) {
      const durationMinutes = Math.ceil(
        data.rows[0].elements[0].duration.value / 60
      );
      return NextResponse.json({ durationMinutes });
    }

    return NextResponse.json(
      { error: "Could not calculate distance" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate distance" },
      { status: 500 }
    );
  }
}
