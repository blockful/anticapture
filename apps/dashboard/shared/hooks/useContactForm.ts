import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";

export const contactFormSchema = z.object({
  nameOrAlias: z.string().min(2),
  whichDao: z.string().min(2),
  options: z.array(z.string()).min(1),
  governorAddress: z.string().optional(),
  contactInformation: z.string().min(3),
  reasonForRequest: z.string().min(3),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormResponse {
  success: boolean;
  message: string;
}

const sendContactForm = async (
  data: ContactFormValues,
): Promise<ContactFormResponse> => {
  const response = await axios.post<ContactFormResponse>("/api/contact", data);
  return response.data;
};

export function useContactForm() {
  return useMutation({
    mutationFn: sendContactForm,
    onError: (error) => {
      console.error("Error submitting contact form:", error);
    },
  });
}
