import { useMutation } from "@tanstack/react-query";

interface DrawingAnalysis {
  identification: string;
  story: string;
  lyrics: string[];
}

interface GameRoundResponse {
  drawings: DrawingAnalysis[];
}

export const submitImageToAI = async (
  images: string[]
): Promise<GameRoundResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVER_URL}/api/analyze-drawings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ drawings: images }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit images to AI");
  }

  return response.json();
};

export const useSubmitImage = () => {
  return useMutation({
    mutationKey: ["submit-images"],
    mutationFn: submitImageToAI,
  });
};
