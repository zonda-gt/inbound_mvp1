import { NextRequest, NextResponse } from "next/server";
import {
  resolvePlace,
  getTransitRoute,
  getWalkingRoute,
  TransitRoute,
  WalkingRoute,
} from "@/lib/amap";

const DEFAULT_ORIGIN = "121.4737,31.2304"; // People's Square

export type NavigationResult = {
  destination: {
    name: string;
    inputName: string;
    address: string;
    location: string;
  };
  transit: TransitRoute | null;
  walking: WalkingRoute | null;
  summary: string;
};

function buildSummary(
  destName: string,
  transit: TransitRoute | null,
  walking: WalkingRoute | null,
): string {
  const parts: string[] = [];

  parts.push(`Destination: ${destName}`);

  if (transit) {
    parts.push(
      `Transit route: ${transit.totalDuration} min total, ${transit.segments.length} step(s), ${transit.transferCount} transfer(s), fare ${transit.cost}`,
    );
    for (let i = 0; i < transit.segments.length; i++) {
      const s = transit.segments[i];
      if (s.type === "walking") {
        parts.push(
          `  Step ${i + 1}: Walk ${s.distance}m (~${s.duration} min)`,
        );
      } else {
        parts.push(
          `  Step ${i + 1}: Take ${s.lineName} from ${s.departureStop} to ${s.arrivalStop} (${s.stopCount} stops)`,
        );
      }
    }
  }

  if (walking) {
    parts.push(
      `Walking only: ${walking.distance}m, ~${walking.duration} min`,
    );
  }

  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const { destination, origin, city } = await request.json();

    if (!destination) {
      return NextResponse.json(
        { error: "destination is required" },
        { status: 400 },
      );
    }

    const place = await resolvePlace(destination, city || "上海");

    if (!place) {
      return NextResponse.json(
        {
          error: "Could not find that location",
          suggestion:
            "Try a more specific name, or provide the Chinese name.",
        },
        { status: 404 },
      );
    }

    const originCoords = origin || DEFAULT_ORIGIN;

    const [transit, walking] = await Promise.all([
      getTransitRoute(originCoords, place.location, city || "上海"),
      getWalkingRoute(originCoords, place.location),
    ]);

    const result: NavigationResult = {
      destination: {
        name: place.name,
        inputName: destination,
        address: place.formatted_address,
        location: place.location,
      },
      transit,
      walking,
      summary: buildSummary(place.name, transit, walking),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Navigation API error:", error);
    return NextResponse.json(
      { error: "Navigation lookup failed. Please try again." },
      { status: 500 },
    );
  }
}
