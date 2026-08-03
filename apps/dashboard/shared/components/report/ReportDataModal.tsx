"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/components/design-system/form/Form";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import {
  type ReportFormValues,
  useReportForm,
} from "@/shared/hooks/useReportForm";

type ReportDataModalProps = {
  daoId: string;
  panel: string;
  subject?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof error.response.data.error === "string"
  ) {
    return error.response.data.error;
  }

  return "We couldn't submit your report. Please try again shortly.";
};

/** The public data-quality report flow for the current DAO section, as a controlled modal. */
export const ReportDataModal = ({
  daoId,
  panel,
  subject,
  open,
  onOpenChange,
}: ReportDataModalProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { form, mutate, isPending, error } = useReportForm({
    daoId,
    panel,
    subject,
  });

  const resetReportForm = useCallback(() => {
    form.reset({
      daoId,
      panel,
      subject: subject ?? "",
      description: "",
      email: "",
      url: "",
    });
  }, [daoId, panel, subject, form]);

  useEffect(() => {
    setIsSubmitted(false);
    resetReportForm();
  }, [resetReportForm]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    setIsSubmitted(false);
    resetReportForm();
  };

  const handleSubmit = (data: ReportFormValues) => {
    mutate(data, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Report incorrect data"
      description="Tell us what looks wrong. We'll review it as soon as possible."
      className="max-w-125"
      bodyClassName="p-5"
    >
      {isSubmitted ? (
        <div className="space-y-3 py-4 text-center">
          <h2 className="text-primary text-lg font-medium">Report received</h2>
          <p className="text-secondary text-sm">
            Thanks for helping us improve Anticapture.
          </p>
          <Button variant="primary" onClick={() => handleOpenChange(false)}>
            Done
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="text-secondary text-sm">
              <span className="font-medium">Reporting:</span> {panel}
              {subject && <span className="text-primary"> ({subject})</span>}
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="report-description">
                    What looks incorrect?
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      id="report-description"
                      className="min-h-28 resize-y"
                      placeholder="Describe the data issue and, if possible, the expected value."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="report-email" isOptional>
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id="report-email"
                      type="email"
                      placeholder="you@example.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <p className="text-error text-sm" role="alert">
                {getErrorMessage(error)}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isPending}
              loadingText="Sending…"
            >
              Submit report
            </Button>
          </form>
        </Form>
      )}
    </Modal>
  );
};
