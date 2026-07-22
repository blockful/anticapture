"use client";

import { Flag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import { Textarea } from "@/shared/components/design-system/form/fields/textarea/Textarea";
import { Modal } from "@/shared/components/design-system/modal/Modal";
import {
  getReportPanels,
  getReportSection,
} from "@/shared/constants/report-panels";
import {
  type ReportFormValues,
  useReportForm,
} from "@/shared/hooks/useReportForm";

type ReportDataButtonProps = {
  daoId: string;
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

/** Opens the public data-quality report flow for the current DAO section. */
export const ReportDataButton = ({ daoId }: ReportDataButtonProps) => {
  const pathname = usePathname();
  const section = getReportSection(pathname);
  const url =
    typeof window === "undefined"
      ? "https://anticapture.com"
      : window.location.href;
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { form, mutate, isPending, error } = useReportForm({
    daoId,
    section,
    url,
  });
  const panels = getReportPanels(section).map((label) => ({
    label,
    value: label,
  }));

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsSubmitted(false);
      form.reset({
        daoId,
        section,
        panel: "",
        description: "",
        email: "",
        url,
      });
    }
  };

  const handleSubmit = (data: ReportFormValues) => {
    mutate(data, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 shadow-lg"
        data-testid="report-data-button"
      >
        <Flag className="size-4" aria-hidden />
        Report incorrect data
      </Button>
      <Modal
        open={isOpen}
        onOpenChange={handleOpenChange}
        title="Report incorrect data"
        description="Tell us what looks wrong. We'll review it as soon as possible."
        className="max-w-125"
        bodyClassName="p-5"
      >
        {isSubmitted ? (
          <div className="space-y-3 py-4 text-center">
            <h2 className="text-primary text-lg font-medium">
              Report received
            </h2>
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
              <FormField
                control={form.control}
                name="panel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Which panel is incorrect?</FormLabel>
                    <FormControl>
                      <Select
                        items={panels}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Choose a panel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What looks incorrect?</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
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
                    <FormLabel isOptional>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
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
    </>
  );
};
