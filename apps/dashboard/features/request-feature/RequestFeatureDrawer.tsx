"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { REQUEST_FEATURE_PRIORITIES } from "@/features/request-feature/constants";
import {
  requestFeatureFormSchema,
  useRequestFeatureForm,
} from "@/features/request-feature/hooks/useRequestFeatureForm";
import { showToast } from "@/features/request-feature/utils/showToast";
import { Button } from "@/shared/components";
import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/shared/components/design-system/drawer";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/components/design-system/form";
import {
  FormLabel,
  Input,
  Select,
  Textarea,
} from "@/shared/components/design-system/form/fields";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type RequestFeatureFormValues = z.infer<typeof requestFeatureFormSchema>;

interface RequestFeatureDrawerProps {
  daoId: DaoIdEnum;
  isOpen: boolean;
  onClose: () => void;
}

export const RequestFeatureDrawer = ({
  daoId,
  isOpen,
  onClose,
}: RequestFeatureDrawerProps) => {
  const daoConfig = daoConfigByDaoId[daoId];
  const { mutate: sendRequest, isPending } = useRequestFeatureForm();

  const form = useForm<RequestFeatureFormValues>({
    resolver: zodResolver(requestFeatureFormSchema),
    defaultValues: {
      email: "",
      featureRequest: "",
      otherThoughts: "",
    },
  });

  const onSubmit = (data: RequestFeatureFormValues) => {
    sendRequest(
      { ...data, daoId },
      {
        onSuccess: () => {
          showToast(
            "Request sent successfully! Thank you for helping us improve.",
            "success",
          );
          form.reset();
          onClose();
        },
        onError: (error) => {
          console.error("Error submitting feature request:", error);
          showToast("Failed to send request. Please try again.", "error");
        },
      },
    );
  };

  return (
    <DrawerRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader
          subtitle={`${daoConfig.name} governance`}
          title="Request a Feature"
          onClose={onClose}
        />
        <DrawerBody className="overflow-y-auto p-4">
          <div className="flex flex-col gap-6">
            <p className="text-secondary text-sm leading-5">
              We're committed to building the best possible experience through
              the {daoConfig.name} Governance Dashboard. The best ideas come
              from the community, so share your suggestions for new features,
              metrics, and improvements you'd like to see.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Your e-mail<span className="text-error">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featureRequest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        What would you like to see built?
                        <span className="text-error">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-32 resize-none"
                          placeholder='e.g. "A leaderboard showing the most active delegates by voting participation over the last 90 days"'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-secondary">
                        The more detail you share, the better we can bring your
                        idea to life.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        How much is this blocking you today?
                        <span className="text-error">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          items={[...REQUEST_FEATURE_PRIORITIES]}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select priority"
                          error={!!fieldState.error}
                          aria-label="How much is this blocking you today?"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherThoughts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isOptional>Any other thoughts?</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-24 resize-none"
                          placeholder="What's working well, what's frustrating, or anything else on your mind about the dashboard"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </DrawerBody>
        <div className="border-border-default flex shrink-0 justify-end gap-2 border-t px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isPending}
            loading={isPending}
            data-ph-event="feature_request_submitted"
            data-ph-source="request_feature_drawer"
            data-umami-event="feature_request_submitted"
          >
            Submit request <Sparkles size={16} />
          </Button>
        </div>
      </DrawerContent>
    </DrawerRoot>
  );
};
