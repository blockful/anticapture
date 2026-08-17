import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

export const requestFeatureFormSchema = z.object({
  email: z.string().email(),
  featureRequest: z.string().min(10),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  otherThoughts: z.string().optional(),
});

type RequestFeatureFormValues = z.infer<typeof requestFeatureFormSchema>;

interface RequestFeatureResponse {
  message: string;
  id?: string;
}

const sendRequestFeatureForm = async (
  data: RequestFeatureFormValues & { daoId: string },
): Promise<RequestFeatureResponse> => {
  const response = await axios.post<RequestFeatureResponse>(
    "/api/request-feature",
    data,
  );
  return response.data;
};

export function useRequestFeatureForm() {
  return useMutation({
    mutationFn: sendRequestFeatureForm,
    onError: (error) => {
      console.error("Error submitting feature request:", error);
    },
  });
}
