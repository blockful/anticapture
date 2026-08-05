"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const reportFormSchema = z.object({
  daoId: z.string().min(1),
  panel: z.string().min(1),
  subject: z.string().trim().max(200).optional(),
  description: z
    .string()
    .trim()
    .min(3, "Describe the incorrect data in at least 3 characters.")
    .max(5000),
  email: z.union([
    z.string().trim().email("Enter a valid email address."),
    z.literal(""),
  ]),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

type UseReportFormParams = {
  daoId: string;
  panel: string;
  subject?: string;
};

const submitReport = async (data: ReportFormValues) => {
  // Capture URL at submission time to avoid the nuqs query-string bug
  const payload = {
    ...data,
    url:
      typeof window === "undefined"
        ? "https://anticapture.com"
        : window.location.href,
  };
  const response = await axios.post<{ message: string }>(
    "/api/report",
    payload,
  );
  return response.data;
};

/** Manages validation and submission for a public dashboard data report. */
export const useReportForm = ({
  daoId,
  panel,
  subject,
}: UseReportFormParams) => {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      daoId,
      panel,
      subject: subject ?? "",
      description: "",
      email: "",
    },
  });
  const mutation = useMutation({ mutationFn: submitReport });

  return { form, ...mutation };
};
