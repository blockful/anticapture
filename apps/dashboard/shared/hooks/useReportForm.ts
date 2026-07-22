"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const reportFormSchema = z.object({
  daoId: z.string().min(1),
  section: z.string().min(1),
  panel: z.string().min(1, "Choose the affected panel."),
  description: z
    .string()
    .trim()
    .min(3, "Describe the incorrect data in at least 3 characters.")
    .max(5000),
  email: z.union([
    z.string().trim().email("Enter a valid email address."),
    z.literal(""),
  ]),
  url: z.string().url(),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

type UseReportFormParams = Pick<ReportFormValues, "daoId" | "section" | "url">;

const submitReport = async (data: ReportFormValues) => {
  const response = await axios.post<{ message: string }>("/api/report", data);
  return response.data;
};

/** Manages validation and submission for a public dashboard data report. */
export const useReportForm = ({ daoId, section, url }: UseReportFormParams) => {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      daoId,
      section,
      panel: "",
      description: "",
      email: "",
      url,
    },
  });
  const mutation = useMutation({ mutationFn: submitReport });

  return { form, ...mutation };
};
