import { useMutation } from "@tanstack/react-query";

interface AIImageResponse {
  success: boolean;
  prediction?: string;
  error?: string;
}

export const submitImageToAI = async (
  imageData: string
): Promise<AIImageResponse> => {
  const response = await fetch("YOUR_AI_API_ENDPOINT", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: imageData }),
  });

  if (!response.ok) {
    throw new Error("Failed to submit image to AI");
  }

  return response.json();
};

export const useSubmitImage = () => {
  return useMutation({
    mutationKey: ["submit-images"],
    mutationFn: submitImageToAI,
  });
};
